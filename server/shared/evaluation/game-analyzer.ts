import { TetrisBoard } from "../../shared/tetris/tetris-board";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import MoveableTetromino from "../../shared/tetris/moveable-tetromino";

export interface PlacementEvaluation {
    bestPlacementScore: number,
    playerPlacementScore: number,
    info?: string,
}

export interface Position {
    board: TetrisBoard,
    currentPiece: TetrominoType,
    nextPiece: TetrominoType,
    level: number,
    lines: number,
}

export abstract class GameAnalyzer {

    public abstract onNewPosition(position: Position): void;

    public abstract onPlacement(placement: MoveableTetromino): Promise<void>;

    public abstract stopAnalysis(): void;
}