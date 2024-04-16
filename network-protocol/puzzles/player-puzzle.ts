import { TetrominoType } from "../tetris/tetromino-type";
import { GenericPuzzle } from "./generic-puzzle";
import { PuzzleRating } from "./puzzle-rating";

export interface PuzzleFolder {
  id: string;
  name: string;
  creator: string;
  puzzles: PlayerPuzzle[];
}

export interface PlayerPuzzle extends GenericPuzzle {
  id: string;
  creator: string;
}