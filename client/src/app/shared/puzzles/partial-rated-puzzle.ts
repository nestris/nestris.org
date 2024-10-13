import MoveableTetromino from "../tetris/moveable-tetromino";
import { TetrisBoard } from "../tetris/tetris-board";
import { TetrominoType } from "../tetris/tetromino-type";
import { PuzzleRating } from "./puzzle-rating";
import { PuzzleTheme } from "./puzzle-theme";

// interface for rated puzzle before it is added to the database
export interface PartialRatedPuzzle {
  board: TetrisBoard;
  current: TetrominoType;
  next: TetrominoType;
  rating: PuzzleRating;
  theme: PuzzleTheme;
  currentPlacement: MoveableTetromino,
  nextPlacement: MoveableTetromino,
}