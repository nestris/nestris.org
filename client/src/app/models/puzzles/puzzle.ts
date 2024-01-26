import MoveableTetromino from "../tetris/moveable-tetromino";
import { TetrisBoard } from "../tetris/tetris-board";
import { TetrominoType } from "../tetris/tetromino-type";

export interface PuzzleDefinition {
    board: TetrisBoard;
    currentType: TetrominoType;
    nextType: TetrominoType;
    correctCurrentPlacement: MoveableTetromino,
    correctNextPlacement: MoveableTetromino,
    elo: number
}