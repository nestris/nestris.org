import { DBPuzzle } from "./db-puzzle";

export interface UnsolvedRatedPuzzle {
    id: string; // encoded puzzle id with board and pieces
    startElo: number; // starting user elo for the puzzle
    eloGain: number; // elo gain for solving the puzzle
    eloLoss: number; // elo loss for failing the puzzle
}

export interface RatedPuzzleSubmission {
    puzzleID: string; // encoded puzzle id with board and pieces
    seconds: number; // time taken to solve the puzzle
    current?: number; // int2 representing the current tetromino, or undefined if no current piece
    next?: number; // int2 representing the next tetromino, or undefined if no next piece
}

export interface RatedPuzzleResult {
    puzzle: DBPuzzle; // the puzzle that was solved
    isCorrect: boolean; // true if the solution was correct
    newElo: number; // the user's new elo after solving the puzzle
}