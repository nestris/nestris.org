import { SerializedPuzzle } from "server/puzzles/decode-puzzle";
import { PuzzleDefinition, PuzzleResult, PuzzleSolution, PuzzleSubmission } from "./puzzle";

export function isSubmissionComplete(submission: PuzzleSubmission): boolean {
    return submission.firstPiece !== undefined && submission.secondPiece !== undefined;
}

// whether the user submission is equal to the puzzle solution
// precondition: submission is complete
export function equalToSolution(puzzle: SerializedPuzzle, submission: PuzzleSubmission): boolean {

    if (!isSubmissionComplete(submission)) {
        throw new Error("Submission is not complete");
    }

    // if the first piece is not in the correct position, return false
    if (submission.firstPiece!.getRotation() != puzzle.r1) return false;
    if (submission.firstPiece!.getTranslateX() != puzzle.x1) return false;
    if (submission.firstPiece!.getTranslateY() != puzzle.y1) return false;

    // if the second piece is not in the correct position, return false
    if (submission.secondPiece!.getRotation() != puzzle.r2) return false;
    if (submission.secondPiece!.getTranslateX() != puzzle.x2) return false;
    if (submission.secondPiece!.getTranslateY() != puzzle.y2) return false;
  
    // if both pieces are in the correct position, return true
    return true;
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
  
// check whether a puzzle submission is correct
// returns a boolean for correctness, and a string for an explanation
// TODO: more descriptive explanation
export function evaluatePuzzleSubmission(puzzle: SerializedPuzzle, submission: PuzzleSubmission, gaveUp: boolean): PuzzleResult {

    if (gaveUp) {
        return {
            isCorrect: false,
            explanation: "You didn't finish the puzzle!"
        }
    }
            

    // if submission is incomplete, return false
    if (!isSubmissionComplete(submission)) {
        return {
            isCorrect: false,
            explanation: "You ran out of time!"
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