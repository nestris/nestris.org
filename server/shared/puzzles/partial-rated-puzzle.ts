import { TetrominoType } from "../tetris/tetromino-type";
import { PuzzleRating } from "./puzzle-rating";
import { PuzzleTheme } from "./puzzle-theme";

// interface for rated puzzle before it is added to the database
export interface PartialRatedPuzzle {
  boardString: string;
  current: TetrominoType;
  next: TetrominoType;
  rating: PuzzleRating;
  theme: PuzzleTheme;
  r1: number;
  x1: number;
  y1: number;
  r2: number;
  x2: number;
  y2: number;
}