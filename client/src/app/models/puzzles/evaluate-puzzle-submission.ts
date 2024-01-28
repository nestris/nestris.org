import { PuzzleDefinition, PuzzleResult, PuzzleSolution, PuzzleSubmission } from "./puzzle";

export function isSubmissionComplete(submission: PuzzleSubmission): boolean {
    return submission.firstPiece !== undefined && submission.secondPiece !== undefined;
}

// whether the user submission is equal to the puzzle solution
// precondition: submission is complete
export function equalToSolution(submission: PuzzleSubmission, solution: PuzzleSolution): boolean {

    if (!isSubmissionComplete(submission)) {
        throw new Error("Submission is not complete");
    }

    // if first piece is not in the correct position, return false
    if (!submission.firstPiece!.equals(solution.firstPiece)) {
      return false;
    }
  
    // if second piece is not in the correct position, return false
    if (!submission.secondPiece!.equals(solution.secondPiece)) {
      return false;
    }
  
    // if both pieces are in the correct position, return true
    return true;
}

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
    "Your accuracy’s on vacation.",
    "I guess perfection's too mainstream for you.",
]
  
// check whether a puzzle submission is correct
// returns a boolean for correctness, and a string for an explanation
// TODO: more descriptive explanation
export function evaluatePuzzleSubmission(puzzle: PuzzleDefinition, submission: PuzzleSubmission): PuzzleResult {

    // if submission is incomplete, return false
    if (!isSubmissionComplete(submission)) {
        return {
            isCorrect: false,
            explanation: "You ran out of time!"
        }
        }

    // if equal to solution, return true
    if (equalToSolution(submission, puzzle.correctSolution)) {
        return {
            isCorrect: true,
            explanation: puzzle.correctSolution.comment
        }
    }

    // At this point, we know the user submitted an invalid solution.

    // We see if user's incorrect solution matched the incorrect solution list to get a better explanation of why it's wrong
    const incorrectSolution = puzzle.incorrectSolutions.find(solution => equalToSolution(submission, solution));
    if (incorrectSolution) {
        return {
            isCorrect: false,
            explanation: incorrectSolution.comment
        }
    } else { // if not, we give a generic wrong answer comment
        return {
            isCorrect: false,
            explanation: WRONG_ANSWER_COMMENTS[Math.floor(Math.random() * WRONG_ANSWER_COMMENTS.length)]
        }
    }
}