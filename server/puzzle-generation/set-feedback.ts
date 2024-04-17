import { PuzzleFeedback } from "../../network-protocol/puzzles/puzzle-feedback";
import { queryDB } from "../database";
import { Request, Response } from 'express';

// for a user, set feedback (like, un-like, dislike, un-dislike) for a puzzle
export async function setFeedback(puzzleID: string, username: string, feedback: PuzzleFeedback, value: boolean) {

  // make database call. if puzzle_feedback record already exists with (username, puzzle_id), then update the record
  // otherwise, insert a new record
  // console.log("Setting feedback", feedback);
  // console.log("Value", value);
  // console.log("Puzzle ID", puzzleID);
  // console.log("Username", username);

  const query = `
    INSERT INTO puzzle_feedback (username, puzzle_id, ${feedback})
    VALUES ($1, $2, $3)
    ON CONFLICT (username, puzzle_id)
    DO UPDATE SET ${feedback} = $3
  `;

  // console.log(query);

  await queryDB(query, [username, puzzleID, value]);
}

// POST request to set feedback for a puzzle
export async function setFeedbackRoute(req: Request, res: Response) {
  const puzzleID = req.body['id'] as string;
  const username = req.body['username'] as string;
  const feedback = req.body['feedback'] as PuzzleFeedback;
  const valueString = req.body['value'] as string;

  let value;
  if (valueString === "true") value = true;
  else if (valueString === "false") value = false;
  else {
    res.status(404).send("Invalid value");
    return;
  }

  try {
    await setFeedback(puzzleID, username, feedback, value);
    res.status(200).send("Feedback set");
  } catch (error) {
    console.log(error);
    res.status(404).send(error);
  }
}