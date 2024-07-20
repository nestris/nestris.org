import { FirstSecondPlacements, GenericPuzzle } from "./generic-puzzle";

export interface SerializedPuzzleSubmission {
  puzzleID: string;
  userid: string;
  x1?: number;
  y1?: number;
  r1?: number;
  x2?: number;
  y2?: number;
  r2?: number;
}

export function isSubmissionComplete(submission: SerializedPuzzleSubmission): boolean {
  return submission.r1 !== undefined && submission.r2 !== undefined;
}

// whether the user submission is equal to the puzzle solution
// precondition: submission is complete
export function equalToSolution(puzzle: FirstSecondPlacements, submission: SerializedPuzzleSubmission): boolean {

  if (!isSubmissionComplete(submission)) {
      throw new Error("Submission is not complete");
  }

  return (
      submission.r1 === puzzle.r1 &&
      submission.x1 === puzzle.x1 &&
      submission.y1 === puzzle.y1 &&
      submission.r2 === puzzle.r2 &&
      submission.x2 === puzzle.x2 &&
      submission.y2 === puzzle.y2
  );
}

const RIGHT_ANSWER_COMMENTS = [
  "You got it!"
]

const WRONG_ANSWER_COMMENTS = [
  "Good try! This puzzle's a toughie.",
  "Not quite, but you got the next one!",
  "Back to the drawing board!",
  "Left your brain in bed today?",
  "Not even close, but A for effort!",
  "Was that a wild guess?",
  "If that was a dart, you missed the board.",
  "Try again, Einstein.",
]

const WRONG_ANSWER_STREAK_COMEMNTS = [
  "Is your GPS off today?",
  "Your accuracy's on vacation.",
  "I guess perfection's too mainstream for you.",
]

// whether the PuzzleSubmission is correct, and an explanation
export interface PuzzleResult {
  isCorrect: boolean;
  explanation: string;
  resultingElo?: number;
}

// check whether a puzzle submission is correct
// returns a boolean for correctness, and a string for an explanation
// TODO: more descriptive explanation
export function evaluatePuzzleSubmission(puzzle: FirstSecondPlacements, submission: SerializedPuzzleSubmission): PuzzleResult {

  console.log("Evaluating submission", puzzle, submission);

  // if submission is incomplete, return false
  if (!isSubmissionComplete(submission)) {
      return {
          isCorrect: false,
          explanation: "You didn't finish the puzzle!"
      }
      }

  // if equal to solution, return true
  if (equalToSolution(puzzle, submission)) {
      return {
          isCorrect: true,
          explanation: RIGHT_ANSWER_COMMENTS[Math.floor(Math.random() * RIGHT_ANSWER_COMMENTS.length)]
      }
  }

  // At this point, we know the user submitted an invalid solution.
  return {
      isCorrect: false,
      explanation: WRONG_ANSWER_COMMENTS[Math.floor(Math.random() * WRONG_ANSWER_COMMENTS.length)]
  }
}