/*
Get successive boards by playing through games with AI moves.
*/
import { TetrisBoard } from "../../shared/tetris/tetris-board";
import { TetrominoType } from "../../shared/tetris/tetromino-type";

export abstract class BoardGenerator {

  // Reset the board to a new state
  abstract getResetBoardState(): { board: TetrisBoard, current: TetrominoType, next: TetrominoType};

  // Get the next board state
  abstract getNextBoardState(): Promise<{ board: TetrisBoard, current: TetrominoType, next: TetrominoType}>;
}