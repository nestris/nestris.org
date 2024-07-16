import { Request, Response } from 'express';
import { PuzzleRating } from '../../shared/puzzles/puzzle-rating';
import { RatedPuzzle } from '../../shared/puzzles/rated-puzzle';
import { SerializedPuzzleSubmission } from '../../shared/puzzles/serialized-puzzle-submission';
import { queryDB } from '../database';
import { logDatabase } from '../database/log';
import { queryUserByUsername } from '../database/user-queries';
import { getActivePuzzle, setActivePuzzle } from './active-puzzle';
import { decodeRatedPuzzleFromDB } from './decode-rated-puzzle';
import { submitPuzzleAttempt } from './submit-puzzle-attempt';


// given a weight for each of the five possible ratings, return a random rating
// weights must be integers
function getRandomDistribution(one: number, two: number, three: number, four: number, five: number): PuzzleRating[] {
  // make a list with each rating repeated the number of times its weight
  const list: PuzzleRating[] = [];
  for (let i = 0; i < one; i++) list.push(PuzzleRating.ONE_STAR);
  for (let i = 0; i < two; i++) list.push(PuzzleRating.TWO_STAR);
  for (let i = 0; i < three; i++) list.push(PuzzleRating.THREE_STAR);
  for (let i = 0; i < four; i++) list.push(PuzzleRating.FOUR_STAR);
  for (let i = 0; i < five; i++) list.push(PuzzleRating.FIVE_STAR);

  return list;
}

const ELO_0_499 = getRandomDistribution(80, 20, 0, 0, 0); // mostly solving 1 star puzzles
const ELO_500_999 = getRandomDistribution(40, 60, 0, 0, 0); // mostly solving 1-2 star puzzles
const ELO_1000_1499 = getRandomDistribution(30, 40, 30, 0, 0); // mostly solving 2-3 star puzzles
const ELO_1500_1999 = getRandomDistribution(10, 30, 40, 20, 0); // mostly solving 2-4 star puzzles
const ELO_2000_2499 = getRandomDistribution(5, 10, 35, 30, 20); // mostly solving 2-5 star puzzles
const ELO_2500_2999 = getRandomDistribution(2, 4, 30, 44, 20); // mostly solving 3-5 star puzzles with lower chance of 5 star
const ELO_3000_PLUS = getRandomDistribution(2, 2, 32, 32, 32); // mostly solving 3-5 star puzzles

// Given a user's elo, probablistically select the rating of the puzzle the user will play next.
export function getRandomPuzzleRatingForPlayerElo(elo: number): PuzzleRating {

  let distribution: PuzzleRating[];
  if (elo < 500) distribution = ELO_0_499;
  else if (elo < 1000) distribution = ELO_500_999;
  else if (elo < 1500) distribution = ELO_1000_1499;
  else if (elo < 2000) distribution = ELO_1500_1999;
  else if (elo < 2500) distribution = ELO_2000_2499;
  else if (elo < 3000) distribution = ELO_2500_2999;
  else distribution = ELO_3000_PLUS;

  // pick a random rating from the distribution
  return distribution[Math.floor(Math.random() * distribution.length)];
}

// given the user's elo, the number of total puzzle attempts, and the rating of the puzzle, calculate the elo change for the user
export function calculateEloChangeForPuzzle(userElo: number, numAttempts: number, rating: PuzzleRating): { eloGain: number, eloLoss: number } {

  if (rating < PuzzleRating.ONE_STAR) throw new Error("Invalid puzzle rating");

  // based on https://www.desmos.com/calculator/xve7eslecl
  let eloGain = 100 / Math.pow(1.0005, userElo + 3000 - 500*rating);
  let eloLoss = 100 / Math.pow(1.0005, 3000 + 500*rating - userElo);

  // for attempts 0-19, there's a multiplier. At attempt 0, 3x multiplier, at attempt 20+, 1x multiplier
  // https://www.desmos.com/calculator/ys9xtkhdng
  const attemptMultiplier = 1 + 2 * (20 - Math.min(numAttempts, 20)) / 20;
  eloGain *= attemptMultiplier;
  eloLoss *= attemptMultiplier;

  // round to nearest integer
  eloGain = Math.round(eloGain);
  eloLoss = Math.round(eloLoss);

  // prevent eloLoss from being higher than userElo, so that userElo doesn't go negative
  eloLoss = Math.min(eloLoss, userElo);

  return { eloGain, eloLoss };
}

// given a user, select a random puzzle for the user to solve
// The puzzle is not guaranteed to be unsolved by user before, but hopefully puzzle database is large enough that this is unlikely
export async function selectRandomPuzzleForUser(username: string): Promise<RatedPuzzle> {
  
  // first, fetch the user's current puzzle elo from database
  const user = await queryUserByUsername(username);
  if (!user) throw new Error("User not found");

  // second, query how many puzzles the user has attempted by counting the number of puzzle_attempts with matching username
  const puzzleAttempts = await queryDB(`SELECT COUNT(*) FROM puzzle_attempts WHERE username = $1`, [username]);
  const puzzleAttemptsCount = parseInt(puzzleAttempts.rows[0].count);

  // query the database for the user's puzzle elo, as well as the number of puzzles they have attempted
  // counting number of puzzle_attempts with matching username)
  const elo = user.puzzleElo;
  const rating = getRandomPuzzleRatingForPlayerElo(elo);
  console.log(`Selecting random puzzle rating ${rating} for user ${username} with elo ${elo} and ${puzzleAttemptsCount} attempts`);

  // query the database for a random puzzle with the selected rating where the puzzle has not been attempted by the user
  // by ordering by num_attempts_cached and selecting the first puzzle, we prioritize exploration over exploitation
  // ORDER by num_attempts_cached, then randomly
  let result = await queryDB(
    `SELECT * FROM rated_puzzles WHERE rating = $1 AND id NOT IN (SELECT puzzle_id FROM puzzle_attempts WHERE username = $2) ORDER BY num_attempts_cached ASC LIMIT 1`,
    [rating, username]
  );
    
  // if there are no puzzles with the selected rating that the user has not attempted, just select a random puzzle with the rating (that the user has alreaddy attempted)
  if (!result.rows[0]) {
    await logDatabase(username, `No unattempted puzzles with rating ${rating} found, selecting repeated puzzle`);
    console.log(`No unattempted puzzles with rating ${rating} found for user ${username}, selecting repeated puzzle`);
    result = await queryDB(`SELECT * FROM rated_puzzles WHERE rating = $1 ORDER BY RANDOM() LIMIT 1`, [rating]);
  }

  const puzzle = decodeRatedPuzzleFromDB(result.rows[0]);

  // calculate the elo gain and loss for the puzzle
  const { eloGain, eloLoss } = calculateEloChangeForPuzzle(elo, puzzleAttemptsCount, rating);
  puzzle.eloGain = eloGain;
  puzzle.eloLoss = eloLoss;

  return puzzle;
}

// returns a random RatedPuzzle for the user based on their elo
export async function selectRandomPuzzleForUserRoute(req: Request, res: Response) {
  const username = req.params['username'] as string;
  console.log("Selecting random puzzle for user", username);

  try {

    const currentActivePuzzle = await getActivePuzzle(username);

    // if there's already a different puzzle active, first deactivate it by submitting it as a timeout
    if (currentActivePuzzle) {

      // submit the current active puzzle as a timed out attempt
      console.log("TIMING OUT PUZZLE", currentActivePuzzle);

      const submission: SerializedPuzzleSubmission = { // submission with no placements, so it's a timeout
        username: username,
        puzzleID: currentActivePuzzle.puzzleID,
      };
      await submitPuzzleAttempt(submission);
      console.log("finished timing out puzzle");
    }

    const puzzle = await selectRandomPuzzleForUser(username);

    // set as active puzzle
    await setActivePuzzle(username, puzzle.id, puzzle.eloGain!, puzzle.eloLoss!);

    res.status(200).send(puzzle);
  } catch (error) {
    console.error("Failed to select random puzzle for user", username, error);
    res.status(404).send(error);
  }
}