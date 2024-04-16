import { TetrominoType } from "../tetris/tetromino-type";

export interface FirstSecondPlacements {
  r1: number;
  x1: number;
  y1: number;
  r2: number;
  x2: number;
  y2: number;

}

export interface GenericPuzzle extends FirstSecondPlacements {
  id: string;
  boardString: string;
  current: TetrominoType;
  next: TetrominoType;
}