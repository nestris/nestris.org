import { queryDB } from "../database";
import { Request, Response } from "express";
import { clearActivePuzzle } from "./active-puzzle";
import { FirstSecondPlacements } from "../../shared/puzzles/generic-puzzle";
import { SerializedPuzzleSubmission, PuzzleResult, evaluatePuzzleSubmission } from "../../shared/puzzles/serialized-puzzle-submission";
import { TETROMINO_CHAR_TO_TYPE } from "../../shared/tetris/tetrominos";
import { PuzzleRating } from "../../shared/puzzles/puzzle-rating";
import { logDatabase } from "../database/log";

export enum PuzzleState {
  PROVISIONAL = "provisional",
  ADJUSTED = "adjusted",
}

// number of attempts needed to convert a provisional puzzle to an adjusted puzzle
const NUM_ATTEMPTS_NEEDED_TO_ADJUST = 10;

interface JoinSchema extends FirstSecondPlacements {
  puzzle_id: string;
  elo_gain: number;
  elo_loss: number;
  seconds_since: number;
  puzzle_elo: number;
  current_piece: string;
  next_piece: string;
  num_attempts_cached: number;
  num_solves_cached: number;
  rating: PuzzleRating,
  state: PuzzleState;
}

export async function submitPuzzleAttempt(submission: SerializedPuzzleSubmission): Promise<PuzzleResult> {

  // get active puzzle joined with rated_puzzles, joined with the users table with the username
  const result = await queryDB(
    `SELECT puzzle_id, elo_gain, elo_loss, EXTRACT(EPOCH FROM (NOW() - started_at)) AS seconds_since, puzzle_elo,
      x1, y1, r1, x2, y2, r2, current_piece, next_piece, num_attempts_cached, num_solves_cached, rating, state
    FROM active_puzzles
    JOIN rated_puzzles ON active_puzzles.puzzle_id = rated_puzzles.id
    JOIN users ON active_puzzles.userid = users.userid
    WHERE active_puzzles.userid = $1`,
    [submission.userid]
  );

  // no active puzzle found
  if (result.rows.length === 0) {
    throw new Error("No active puzzle found for user");
  }

  const join = result.rows[0] as JoinSchema;
  console.log("Join:", join);

  // check that the active puzzle ID matches the submission
  if (join.puzzle_id !== submission.puzzleID) {
    throw new Error(`Active puzzle ID does not match submission ${join.puzzle_id} ${submission.puzzleID}`);
  }

  join.current = TETROMINO_CHAR_TO_TYPE[join.current_piece];
  join.next = TETROMINO_CHAR_TO_TYPE[join.next_piece];

  const puzzleResult: PuzzleResult = evaluatePuzzleSubmission(join, submission);

  // update elo
  const eloBefore = join.puzzle_elo;
  const eloChange = puzzleResult.isCorrect ? join.elo_gain : -join.elo_loss;
  puzzleResult.resultingElo = eloBefore + eloChange;

  console.log("Elo change", eloChange, "Resulting elo", puzzleResult.resultingElo);

  // calulate time taken
  let timeTakenSeconds = Math.round(Math.min(join.seconds_since, 3600)); // cap time taken to 1 hour
  console.log("Time taken", timeTakenSeconds, "seconds");

  // insert new record to puzzle_attempts
  await queryDB(
    `INSERT INTO puzzle_attempts (userid, puzzle_id, is_correct, elo_before, elo_change, solve_time, x1, y1, r1, x2, y2, r2)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [submission.userid, submission.puzzleID, puzzleResult.isCorrect, eloBefore, eloChange, timeTakenSeconds, submission.x1, submission.y1, submission.r1, submission.x2, submission.y2, submission.r2]
  );

  // update user's puzzle elo
  await queryDB("UPDATE users SET puzzle_elo = $1 WHERE userid = $2", [puzzleResult.resultingElo, submission.userid]);

  console.log("Updated user's puzzle elo", puzzleResult.resultingElo);

  // remove the active puzzle
  await clearActivePuzzle(submission.userid);

  // Trigger a puzzle rating update to get puzzle from provisional -> adjusted if num required attempts reached
  join.num_attempts_cached++;
  if (puzzleResult.isCorrect) join.num_solves_cached++;
  if (join.num_attempts_cached >= NUM_ATTEMPTS_NEEDED_TO_ADJUST && join.state === PuzzleState.PROVISIONAL) {
    const successRate = join.num_solves_cached / join.num_attempts_cached;
    await adjustPuzzleRating(submission.userid, join.puzzle_id, join.rating, successRate);
  }

  return puzzleResult;

}

export async function submitPuzzleAttemptRoute(req: Request, res: Response) {

  const submission = req.body as SerializedPuzzleSubmission;
  console.log("Submitting puzzle attempt", submission);

  try {
    const puzzleResult = await submitPuzzleAttempt(submission);
    res.status(200).send(puzzleResult);
  } catch (e: any) {
    console.error(e);
    res.status(412).send(e.message);
  }
}

export async function adjustPuzzleRating(userid: string, puzzleID: string, rating: PuzzleRating, successRate: number) {

  let newRating: PuzzleRating;
  if (successRate >= 0.8) { // Decrease rating if success rate is high
    // if already 1 or 2 star, don't decrease
    if (rating <= PuzzleRating.TWO_STAR) return;

    newRating = rating - 1;

  } else if (successRate <= 0.4) { // Increase rating if success rate is low
    // if already 5 star, don't increase
    if (rating === PuzzleRating.FIVE_STAR) return;

    newRating = rating + 1;
  } else {
    // no change
    return;
  }

  // Update the puzzle rating and set state to adjusted
  const updatePuzzleRating = queryDB(
    `UPDATE rated_puzzles SET rating = $1, state = $2 WHERE id = $3`,
    [newRating, PuzzleState.ADJUSTED, puzzleID]
  );

  // Log the rating change
  const logAdjustment = logDatabase(userid, `Adjusted puzzle ${puzzleID} rating from ${rating} to ${newRating} with success rate ${successRate}`);

  // Wait for both to complete
  await Promise.all([updatePuzzleRating, logAdjustment]);

  console.log("Adjusted puzzle rating", puzzleID, "from", rating, "to", newRating, "with success rate", successRate);
}