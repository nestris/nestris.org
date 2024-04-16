import { TetrominoType } from "../tetris/tetromino-type";

export interface GenericPuzzle {
  id: string;
  boardString: string;
  current: TetrominoType;
  next: TetrominoType;
  r1: number;
  x1: number;
  y1: number;
  r2: number;
  x2: number;
  y2: number;
}