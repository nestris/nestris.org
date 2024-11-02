import { TetrisBoard } from "./tetris-board";
import { TetrominoType } from "./tetromino-type";

export interface GameDisplayData {
    board: TetrisBoard;
    nextPiece: TetrominoType;
    level: number;
    lines: number;
    score: number;
    trt: number;
    countdown: number | undefined;
}

export const DEFAULT_POLLED_GAME_DATA: GameDisplayData = {
    board: new TetrisBoard(),
    nextPiece: TetrominoType.ERROR_TYPE,
    level: 18,
    lines: 0,
    score: 0,
    trt: 0,
    countdown: undefined
};