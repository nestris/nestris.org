import { Request, Response } from 'express';
import { PuzzleRating } from '../../shared/puzzles/puzzle-rating';
import { RatedPuzzle } from '../../shared/puzzles/rated-puzzle';
import { queryDB } from '../database';
import { logDatabase } from '../database/log';
import { queryUserByUserID } from '../database/user-queries';
import { decodeRatedPuzzleFromDB } from './decode-rated-puzzle';
import { ServerState } from '../server-state/server-state';

export function calculateProbabilities(elo: number): number[] {

  if (elo < 200) return [1, 0, 0, 0, 0, 0];

  const minElo = 0;
  const maxElo = 3500;
  const boundedElo = Math.min(Math.max(elo, minElo), maxElo);

  const eloMidpoint = 2000; // At midpoint, normalizedElo = 0.5

  let normalizedElo;
  if (elo < eloMidpoint) normalizedElo = (boundedElo - minElo) / (eloMidpoint - minElo) * 0.5;
  else normalizedElo = 0.5 + (boundedElo - eloMidpoint) / (maxElo - eloMidpoint) * 0.5;
  
  const oneStar = Math.max(0, 1 - normalizedElo * 3);
  const twoStar = Math.max(0, 1 - Math.abs(normalizedElo - 0.3) * 3); 
  const threeStar = Math.max(0, 1 - Math.abs(normalizedElo - 0.5) * 2.5); 
  const fourStar = Math.max(0, 1 - Math.abs(normalizedElo - 0.75) * 2);
  let fiveStar = Math.max(0, normalizedElo * 3 - 1.5);

  // From 3000+, if puzzle was 5 star, there is an increasing chance of 6 star
  let sixStar = 0;
  if (elo >= 3000) {
    sixStar = Math.min(fiveStar, (elo - 2500) / 3000);
    fiveStar -= sixStar;
  }

  const total = oneStar + twoStar + threeStar + fourStar + fiveStar + sixStar;
  return [oneStar, twoStar, threeStar, fourStar, fiveStar, sixStar].map(p => p / total);
}

export function getRandomPuzzleRatingForPlayerElo(elo: number): PuzzleRating {

  const probabilities = calculateProbabilities(elo);
  const randomValue = Math.random();
  let cumulativeProbability = 0;

  for (let i = 0; i < probabilities.length; i++) {
    cumulativeProbability += probabilities[i];
    if (randomValue <= cumulativeProbability) {
      return i + 1 as PuzzleRating;
    }
  }

  // This should never happen, but TypeScript needs a return statement
  return PuzzleRating.THREE_STAR;
}

// given the user's elo, the number of total puzzle attempts, and the rating of the puzzle, calculate the elo change for the user
export function calculateEloChangeForPuzzle(userElo: number, rating: PuzzleRating): { eloGain: number, eloLoss: number } {

  if (rating < PuzzleRating.ONE_STAR) throw new Error("Invalid puzzle rating");

  // Boost 6 star puzzles to 8 star for elo calculation
  let ratingNum: number = rating;
  if (rating === PuzzleRating.SIX_STAR) ratingNum = 8;

  const puzzleEloEquivalent = 500 * ratingNum;
  const eloDelta = userElo - puzzleEloEquivalent;

  const ELO_SCALAR = 15;
  const ELO_GROWTH = 1.0003;

  // based on https://www.desmos.com/calculator/47qqusqzhp
  let eloGain = ELO_SCALAR / Math.pow(ELO_GROWTH, eloDelta);
  let eloLoss = ELO_SCALAR / Math.pow(ELO_GROWTH, -eloDelta);

  // Multipler of 2x at elo=0 to 1x at elo=BOOST_THRESHOLD
  const BOOST_THRESHOLD = 500;
  let attemptMultiplier = 1;
  if (userElo < BOOST_THRESHOLD) {
    attemptMultiplier = 2 - userElo / BOOST_THRESHOLD;
  }
  eloGain *= attemptMultiplier;

  // round to nearest integer
  eloGain = Math.round(eloGain);
  eloLoss = Math.round(eloLoss);

  // prevent eloLoss from being higher than userElo, so that userElo doesn't go negative
  eloLoss = Math.min(eloLoss, userElo);

  return { eloGain, eloLoss };
}

export async function fetchRandomPuzzleWithRating(rating: PuzzleRating, userid: string): Promise<RatedPuzzle> {
  console.log(`Selecting random puzzle rating ${rating} for user ${userid}`);

  // query the database for a random puzzle with the selected rating where the puzzle has not been attempted by the user
  // order randomly
  // we ignore puzzles with 2 or greater num_dislikes_cached, as they are likely to be bad puzzles
  let result = await queryDB(
    `SELECT * FROM rated_puzzles WHERE rating = $1 AND num_dislikes_cached < 2 AND id NOT IN (SELECT puzzle_id FROM puzzle_attempts WHERE userid = $2 AND puzzle_id is not NULL) ORDER BY RANDOM() ASC LIMIT 1`,
    [rating, userid]
  );

  // if trying to select a 6 star puzzle but all solved, return 5 star puzzle where user has not attempted
  if (!result.rows[0] && rating === PuzzleRating.SIX_STAR) {
    logDatabase(userid, `No unattempted 6 star puzzles found, selecting 5 star puzzle`);
    console.log(`No unattempted 6 star puzzles found for user ${userid}, selecting 5 star puzzle`);
    result = await queryDB(
      `SELECT * FROM rated_puzzles WHERE rating = $1 AND num_dislikes_cached < 2 AND id NOT IN (SELECT puzzle_id FROM puzzle_attempts WHERE userid = $2 AND puzzle_id is not NULL) ORDER BY RANDOM() ASC LIMIT 1`,
      [PuzzleRating.FIVE_STAR, userid]
    );
  }
    
  // if there are no puzzles with the selected rating that the user has not attempted, just select a random puzzle with the rating (that the user has alreaddy attempted)
  if (!result.rows[0]) {
    logDatabase(userid, `No unattempted puzzles with rating ${rating} found, selecting repeated puzzle`);
    console.log(`No unattempted puzzles with rating ${rating} found for user ${userid}, selecting repeated puzzle`);
    result = await queryDB(`SELECT * FROM rated_puzzles WHERE rating = $1 ORDER BY RANDOM() LIMIT 1`, [rating]);
  }

  const puzzle = decodeRatedPuzzleFromDB(result.rows[0]);
  return puzzle;
}

// given a user, select a random puzzle for the user to solve
// The puzzle is not guaranteed to be unsolved by user before, but hopefully puzzle database is large enough that this is unlikely
export async function selectRandomPuzzleForUser(state: ServerState, userid: string): Promise<RatedPuzzle> {
  
  // Fetch the puzzle, either prefetched or new
  const { puzzle, elo } = await state.puzzlePrefetchManager.getPuzzleForUser(userid);

  // calculate the elo gain and loss for the puzzle
  const { eloGain, eloLoss } = calculateEloChangeForPuzzle(elo, puzzle.rating);
  
  puzzle.eloGain = eloGain;
  puzzle.eloLoss = eloLoss;
  puzzle.userElo = elo;
  return puzzle;
}

// returns a random RatedPuzzle for the user based on their elo
export async function selectRandomPuzzleForUserRoute(req: Request, res: Response, state: ServerState) {
  const userid = req.params['userid'];
  console.log("Selecting random puzzle for user", userid);

  try {

    await state.activePuzzleManager.timeoutActivePuzzle(userid);

    const puzzle = await selectRandomPuzzleForUser(state, userid);

    // set as active puzzle
    state.activePuzzleManager.setActivePuzzle(userid, puzzle, puzzle.userElo!, puzzle.eloGain!, puzzle.eloLoss!);

    res.status(200).send(puzzle);
  } catch (error) {
    console.error("Failed to select random puzzle for user", userid, error);
    res.status(404).send(error);
  }
}