import { PuzzleFeedback } from "../../shared/puzzles/puzzle-feedback";
import { queryDB } from "../database-old";
import { Request, Response } from 'express';

// for a user, set feedback (like, un-like, dislike, un-dislike) for a puzzle
export async function setFeedback(puzzleID: string, userid: string, feedback: PuzzleFeedback) {

  // make database call. if puzzle_feedback record already exists with (username, puzzle_id), then update the record
  // otherwise, insert a new record
  // console.log("Setting feedback", feedback);
  // console.log("Value", value);
  // console.log("Puzzle ID", puzzleID);
  // console.log("Username", username);

  const query = `
    INSERT INTO puzzle_feedback (userid, puzzle_id, feedback)
    VALUES ($1, $2, $3)
    ON CONFLICT (userid, puzzle_id)
    DO UPDATE SET feedback = $3
  `;

  // console.log(query);

  await queryDB(query, [userid, puzzleID, feedback]);
}

// POST request to set feedback for a puzzle
export async function setFeedbackRoute(req: Request, res: Response) {
  const puzzleID = req.body['id'] as string;
  const userid = req.body['userid'] as string;
  const feedback = req.body['feedback'] as PuzzleFeedback;


  try {
    await setFeedback(puzzleID, userid, feedback);
    res.status(200).send({success: true});
  } catch (error) {
    console.log(error);
    res.status(404).send(error);
  }
}