import { Request, Response } from 'express';
import { PuzzleRating } from '../../shared/puzzles/puzzle-rating';
import { RatedPuzzle } from '../../shared/puzzles/rated-puzzle';
import { SerializedPuzzleSubmission } from '../../shared/puzzles/serialized-puzzle-submission';
import { queryDB } from '../database';
import { logDatabase } from '../database/log';
import { queryUserByUserID } from '../database/user-queries';
import { getActivePuzzle, setActivePuzzle } from './active-puzzle';
import { decodeRatedPuzzleFromDB } from './decode-rated-puzzle';
import { submitPuzzleAttempt } from './submit-puzzle-attempt';

export function calculateProbabilities(elo: number): number[] {

  if (elo < 200) return [1, 0, 0, 0, 0];

  const minElo = 0;
  const maxElo = 4000;
  const normalizedElo = Math.min(Math.max(elo, minElo), maxElo) / maxElo;
  
  const oneStar = Math.max(0, 1 - normalizedElo * 3);
  const twoStar = Math.max(0, 1 - Math.abs(normalizedElo - 0.3) * 3); 
  const threeStar = Math.max(0, 1 - Math.abs(normalizedElo - 0.5) * 2.5); 
  const fourStar = Math.max(0, 1 - Math.abs(normalizedElo - 0.75) * 2);
  const fiveStar = Math.max(0, normalizedElo * 3 - 1.5);


  const total = oneStar + twoStar + threeStar + fourStar + fiveStar;
  return [oneStar, twoStar, threeStar, fourStar, fiveStar].map(p => p / total);
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

  const puzzleEloEquivalent = 500 * rating;
  const eloDelta = userElo - puzzleEloEquivalent;

  const ELO_SCALAR = 15;
  const ELO_GROWTH = 1.0003;

  // based on https://www.desmos.com/calculator/aro3yocury
  let eloGain = ELO_SCALAR / Math.pow(ELO_GROWTH, eloDelta);
  let eloLoss = ELO_SCALAR / Math.pow(ELO_GROWTH, -eloDelta);

  // Multipler of 3x at elo=0 to 1x at elo=1000
  let attemptMultiplier = 1;
  if (userElo < 1000) {
    attemptMultiplier = 3 - 2 * userElo / 1000;
  }
  eloGain *= attemptMultiplier;

  // round to nearest integer
  eloGain = Math.round(eloGain);
  eloLoss = Math.round(eloLoss);

  // prevent eloLoss from being higher than userElo, so that userElo doesn't go negative
  eloLoss = Math.min(eloLoss, userElo);

  return { eloGain, eloLoss };
}

// given a user, select a random puzzle for the user to solve
// The puzzle is not guaranteed to be unsolved by user before, but hopefully puzzle database is large enough that this is unlikely
export async function selectRandomPuzzleForUser(userid: string): Promise<RatedPuzzle> {
  
  // first, fetch the user's current puzzle elo from database
  const user = await queryUserByUserID(userid);
  if (!user) throw new Error("User not found");

  // query the database for the user's puzzle elo, as well as the number of puzzles they have attempted
  // counting number of puzzle_attempts with matching userid)
  const elo = user.puzzleElo;
  const rating = getRandomPuzzleRatingForPlayerElo(elo);
  console.log(`Selecting random puzzle rating ${rating} for user ${userid} with elo ${elo}`);

  // query the database for a random puzzle with the selected rating where the puzzle has not been attempted by the user
  // order randomly
  // we ignore puzzles with 2 or greater num_dislikes_cached, as they are likely to be bad puzzles
  let result = await queryDB(
    `SELECT * FROM rated_puzzles WHERE rating = $1 AND num_dislikes_cached < 2 AND id NOT IN (SELECT puzzle_id FROM puzzle_attempts WHERE userid = $2) ORDER BY RANDOM() ASC LIMIT 1`,
    [rating, userid]
  );
    
  // if there are no puzzles with the selected rating that the user has not attempted, just select a random puzzle with the rating (that the user has alreaddy attempted)
  if (!result.rows[0]) {
    await logDatabase(userid, `No unattempted puzzles with rating ${rating} found, selecting repeated puzzle`);
    console.log(`No unattempted puzzles with rating ${rating} found for user ${userid}, selecting repeated puzzle`);
    result = await queryDB(`SELECT * FROM rated_puzzles WHERE rating = $1 ORDER BY RANDOM() LIMIT 1`, [rating]);
  }

  const puzzle = decodeRatedPuzzleFromDB(result.rows[0]);

  // calculate the elo gain and loss for the puzzle
  const { eloGain, eloLoss } = calculateEloChangeForPuzzle(elo, rating);
  puzzle.eloGain = eloGain;
  puzzle.eloLoss = eloLoss;

  return puzzle;
}

// returns a random RatedPuzzle for the user based on their elo
export async function selectRandomPuzzleForUserRoute(req: Request, res: Response) {
  const userid = req.params['userid'];
  console.log("Selecting random puzzle for user", userid);

  try {

    const currentActivePuzzle = await getActivePuzzle(userid);

    // if there's already a different puzzle active, first deactivate it by submitting it as a timeout
    if (currentActivePuzzle) {

      // submit the current active puzzle as a timed out attempt
      console.log("TIMING OUT PUZZLE", currentActivePuzzle);

      const submission: SerializedPuzzleSubmission = { // submission with no placements, so it's a timeout
        userid: userid,
        puzzleID: currentActivePuzzle.puzzleID,
      };
      await submitPuzzleAttempt(submission);
      console.log("finished timing out puzzle");
    }

    const puzzle = await selectRandomPuzzleForUser(userid);

    // set as active puzzle
    await setActivePuzzle(userid, puzzle.id, puzzle.eloGain!, puzzle.eloLoss!);

    res.status(200).send(puzzle);
  } catch (error) {
    console.error("Failed to select random puzzle for user", userid, error);
    res.status(404).send(error);
  }
}