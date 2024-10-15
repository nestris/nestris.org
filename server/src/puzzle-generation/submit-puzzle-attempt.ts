import { queryDB } from "../database";
import { Request, Response } from "express";
import { SerializedPuzzleSubmission, PuzzleResult, evaluatePuzzleSubmission } from "../../shared/puzzles/serialized-puzzle-submission";
import { PuzzleRating } from "../../shared/puzzles/puzzle-rating";
import { logDatabase } from "../database/log";
import { ServerState } from "../old/server-state";
import { PuzzleState } from "../../shared/puzzles/rated-puzzle";
import MoveableTetromino from "../../shared/tetris/moveable-tetromino";

// number of attempts needed to convert a provisional puzzle to an adjusted puzzle
const NUM_ATTEMPTS_NEEDED_TO_ADJUST = 8;


export async function submitPuzzleAttempt(state: ServerState, submission: SerializedPuzzleSubmission): Promise<PuzzleResult> {

  const activePuzzle = state.activePuzzleManager.getActivePuzzle(submission.userid);

  // no active puzzle found
  if (activePuzzle === undefined) {
    throw new Error("No active puzzle found for user");
  }

  // check that the active puzzle ID matches the submission
  if (activePuzzle.puzzle.id !== submission.puzzleID) {
    throw new Error(`Active puzzle ID does not match submission ${activePuzzle.puzzle.id} ${submission.puzzleID}`);
  }

  const puzzleResult: PuzzleResult = evaluatePuzzleSubmission(activePuzzle.puzzle, submission);

  // update elo
  const eloBefore = activePuzzle.userElo;
  const eloChange = puzzleResult.isCorrect ? activePuzzle.eloGain : -activePuzzle.eloLoss;
  puzzleResult.resultingElo = eloBefore + eloChange;

  console.log("Elo change", eloChange, "Resulting elo", puzzleResult.resultingElo);

  // calulate time taken
  let timeTakenSeconds = Math.round(Math.min(activePuzzle.getElapsedTime(), 30)); // cap time taken to 30 seconds
  console.log("Time taken", timeTakenSeconds, "seconds");

  const submissionCurrentPlacement = new MoveableTetromino(activePuzzle.puzzle.current, submission.r1!, submission.x1!, submission.y1!);
  const submissionNextPlacement = new MoveableTetromino(activePuzzle.puzzle.next, submission.r2!, submission.x2!, submission.y2!);

  // insert new record to puzzle_attempts
  const puzzleAttemptQuery = queryDB(
    `INSERT INTO puzzle_attempts (userid, puzzle_id, rating, is_correct, elo_before, elo_change, solve_time, current_placement, next_placement)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [submission.userid, submission.puzzleID, activePuzzle.puzzle.rating, puzzleResult.isCorrect, eloBefore, eloChange, timeTakenSeconds, submissionCurrentPlacement.getInt2(), submissionNextPlacement.getInt2()]
  );

  // update user's puzzle elo
  const updateEloQuery = queryDB("UPDATE users SET puzzle_elo = $1 WHERE userid = $2", [puzzleResult.resultingElo, submission.userid]);

  // wait for both to complete
  await Promise.all([puzzleAttemptQuery, updateEloQuery]);

  console.log("Updated user's puzzle elo", puzzleResult.resultingElo);

  // remove the active puzzle
  state.activePuzzleManager.clearActivePuzzle(submission.userid);

  // Trigger a puzzle rating update to get puzzle from provisional -> adjusted if num required attempts reached
  // do not need to wait for this to complete
  const puzzleState = activePuzzle.puzzle.state;
  let numAttempts = activePuzzle.puzzle.numAttempts + 1;
  let numSolves = activePuzzle.puzzle.numSolves;
  if (puzzleResult.isCorrect) numSolves++;

  if (numAttempts >= NUM_ATTEMPTS_NEEDED_TO_ADJUST && puzzleState === PuzzleState.PROVISIONAL) {
    const successRate = numSolves / numAttempts;
    adjustPuzzleRating(submission.userid, activePuzzle.puzzle.id, activePuzzle.puzzle.rating, successRate);
  }

  // Start prefetching the next puzzle
  state.puzzlePrefetchManager.prefetchPuzzleForUser(submission.userid, puzzleResult.resultingElo);

  puzzleResult.beforeElo = eloBefore;
  return puzzleResult;

}

export async function submitPuzzleAttemptRoute(req: Request, res: Response, state: ServerState) {

  const submission = req.body as SerializedPuzzleSubmission;
  console.log("Submitting puzzle attempt", submission);

  try {
    const puzzleResult = await submitPuzzleAttempt(state, submission);
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
    else if (successRate >= 0.9 && rating === PuzzleRating.FIVE_STAR) newRating = PuzzleRating.THREE_STAR;
    else newRating = rating - 1;

  } else if ( // In the special case where a puzzle is really hard, bump to a 6 star
    (successRate <= 0.125 && rating === PuzzleRating.FIVE_STAR) ||
    (successRate === 0 && rating === PuzzleRating.FOUR_STAR)
  ) {
    newRating = PuzzleRating.SIX_STAR;

  } else if (successRate <= 0.4) { // Increase rating if success rate is low

    // if already 5 star, don't increase
    if (rating === PuzzleRating.FIVE_STAR) return;
    else if (successRate <= 0.2 && rating <= PuzzleRating.TWO_STAR) newRating = rating + 2;
    else newRating = rating + 1;

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