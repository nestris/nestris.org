import { TetrominoType } from "../tetris/tetromino-type";
import { PuzzleRating } from "./puzzle-rating";

export interface Puzzle {
  boardString: string;
  current: TetrominoType;
  next: TetrominoType;
  rating: PuzzleRating;
}
