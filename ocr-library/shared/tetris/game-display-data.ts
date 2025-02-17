import { TetrisBoard } from "./tetris-board";
import { TetrominoType } from "./tetromino-type";

export interface GameDisplayDataWithoutBoard {
    nextPiece: TetrominoType;
    level: number;
    lines: number;
    score: number;
    trt: number;
    drought: number | null;
    countdown: number | undefined;
}

export interface GameDisplayData extends GameDisplayDataWithoutBoard {
    board: TetrisBoard;
}

export const DEFAULT_POLLED_GAME_DATA: GameDisplayData = {
    board: new TetrisBoard(),
    nextPiece: TetrominoType.ERROR_TYPE,
    level: 18,
    lines: 0,
    score: 0,
    trt: 0,
    drought: null,
    countdown: undefined
};