import MoveableTetromino from "../../../../../network-protocol/tetris/moveable-tetromino";
import { TetrisBoard } from "../../../../../network-protocol/tetris/tetris-board";
import { TetrominoType } from "../../../../../network-protocol/tetris/tetromino-type";


export interface PuzzleSubmission {
    firstPiece?: MoveableTetromino;
    secondPiece?: MoveableTetromino;
}

