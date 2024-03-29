import MoveableTetromino from "../../../../../network-protocol/tetris/moveable-tetromino";
import { TetrisBoard } from "../../../../../network-protocol/tetris/tetris-board";
import { TetrominoType } from "../../../../../network-protocol/tetris/tetromino-type";


export interface PuzzleDefinition {
    board: TetrisBoard;
    currentType: TetrominoType;
    nextType: TetrominoType;

    elo: number, // puzzle difficulty elo
    eloGain: number, // elo gained for solving puzzle. calculated based on puzzle and user elo
    eloLoss: number, // elo lost for failing puzzle. calculated based on puzzle and user elo

    attempts: number, // number of people who have attempted this puzzle
    successes: number, // number of people who have solved this puzzle

    correctSolution: PuzzleSolution; // the correct solution to the puzzle
    incorrectSolutions: PuzzleSolution[]; // incorrect solutions to the puzzle

}

// a possible solution to the puzzle. Part of the puzzle definition
export interface PuzzleSolution {
    votes: number; // number of people who have voted for this solution
    score: number; // StackRabbit evaluation
    firstPiece: MoveableTetromino; // placement of first piece
    secondPiece: MoveableTetromino; // placement of second piece
}

export interface PuzzleSubmission {
    firstPiece?: MoveableTetromino;
    secondPiece?: MoveableTetromino;
}

// whether the PuzzleSubmission is correct, and an explanation
export interface PuzzleResult {
    isCorrect: boolean;
    explanation: string;
}