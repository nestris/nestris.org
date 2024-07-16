import { queryDB } from "../database";
import { Request, Response } from "express";
import { clearActivePuzzle } from "./active-puzzle";
import { FirstSecondPlacements } from "../../shared/puzzles/generic-puzzle";
import { SerializedPuzzleSubmission, PuzzleResult, evaluatePuzzleSubmission } from "../../shared/puzzles/serialized-puzzle-submission";

interface JoinSchema extends FirstSecondPlacements{
  puzzle_id: string;
  elo_gain: number;
  elo_loss: number;
  seconds_since: number;
  puzzle_elo: number;
}

export async function submitPuzzleAttempt(submission: SerializedPuzzleSubmission): Promise<PuzzleResult> {

  // get active puzzle joined with rated_puzzles, joined with the users table with the username
  const result = await queryDB(
    `SELECT puzzle_id, elo_gain, elo_loss, EXTRACT(EPOCH FROM (NOW() - started_at)) AS seconds_since, puzzle_elo, x1, y1, r1, x2, y2, r2
    FROM active_puzzles
    JOIN rated_puzzles ON active_puzzles.puzzle_id = rated_puzzles.id
    JOIN users ON active_puzzles.username = users.username
    WHERE active_puzzles.username = $1`,
    [submission.username]
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
    `INSERT INTO puzzle_attempts (username, puzzle_id, is_correct, elo_before, elo_change, solve_time, x1, y1, r1, x2, y2, r2)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [submission.username, submission.puzzleID, puzzleResult.isCorrect, eloBefore, eloChange, timeTakenSeconds, submission.x1, submission.y1, submission.r1, submission.x2, submission.y2, submission.r2]
  );

  // update user's puzzle elo
  await queryDB("UPDATE users SET puzzle_elo = $1 WHERE username = $2", [puzzleResult.resultingElo, submission.username]);

  console.log("Updated user's puzzle elo", puzzleResult.resultingElo);

  // remove the active puzzle
  await clearActivePuzzle(submission.username);

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