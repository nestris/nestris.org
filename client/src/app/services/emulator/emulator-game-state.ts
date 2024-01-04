import { RNG } from "../../models/piece-sequence-generation/rng";
import { SmartGameStatus } from "../../models/scoring/smart-game-status";
import { getGravity } from "../../models/tetris/gravity";
import MoveableTetromino from "../../models/tetris/moveable-tetromino";
import { TetrisBoard } from "../../models/tetris/tetris-board";
import { TetrominoType } from "../../models/tetris/tetromino-type";
import { CurrentlyPressedKeys } from "./currently-pressed-keys";
import { Keybind } from "./keybinds";
import { getSpawnDelay } from "./spawn-delay";

export class EmulatorGameState {

    private isolatedBoard: TetrisBoard = new TetrisBoard();
    private status: SmartGameStatus;

    private currentPieceType: TetrominoType;
    private nextPieceType: TetrominoType;

    private activePiece?: MoveableTetromino;

    private spawnDelayFrames = getSpawnDelay();

    // at the start of each piece, this counter resets. it increments by 1 each frame
    // while placementFrameCount < spawnDelayFrames, do not spawn piece
    // at start of placementFrameCount == spawnDelayFrames, spawn piece
    // at end of each frame where (placementFrameCount - spawnDelayFrames + 1) % GRAVITY == 0, drop piece
    private placementFrameCount: number = 0;

    constructor(
        public readonly startLevel: number,
        private readonly rng: RNG,
    ) {
        this.status = new SmartGameStatus(startLevel);
        this.currentPieceType = this.rng.getNextPiece();
        this.nextPieceType = this.rng.getNextPiece();
    }

    getDisplayBoard(): TetrisBoard {
        if (this.activePiece === undefined) return this.isolatedBoard;
        
        const displayBoard = this.isolatedBoard.copy();
        this.activePiece.blitToBoard(displayBoard);
        return displayBoard;
    }

    getNextPieceType(): TetrominoType {
        return this.nextPieceType;
    }

    // given the current state and a set of pressed keys, progress the state
    executeFrame(pressedKeys: CurrentlyPressedKeys) {

        // spawn delay; do nothing
        if (this.placementFrameCount < this.spawnDelayFrames) {
            return;
        }

        // spawn piece
        if (this.placementFrameCount === this.spawnDelayFrames) {
            this.activePiece = MoveableTetromino.fromSpawnPose(this.currentPieceType);
        }

        if (this.activePiece === undefined) throw new Error("inconsistent state: active piece should be defined");

        // attempt the shift/rotation, undo if illegal
        const attemptMove = (dr: number, dt: number) => {
            this.activePiece!.moveBy(dr, dt, 0);
            if (!this.activePiece!.isInBounds() || this.activePiece!.intersectsBoard(this.isolatedBoard)) {
                this.activePiece!.moveBy(-dr, -dt, 0);
            }
        }

        // attempt translate if key is pressed
        if (pressedKeys.isPressed(Keybind.SHIFT_LEFT)) attemptMove(0, -1);
        else if (pressedKeys.isPressed(Keybind.SHIFT_RIGHT)) attemptMove(0, 1);
        
        // attempt rotate if key is pressed
        if (pressedKeys.isPressed(Keybind.ROTATE_LEFT)) attemptMove(0, 0);
        else if (pressedKeys.isPressed(Keybind.ROTATE_RIGHT)) attemptMove(0, 0);

        // gravity
        if ((this.placementFrameCount - this.spawnDelayFrames + 1) % getGravity(this.status.level) === 0) {
            
            // attempt moving piece downwards
            this.activePiece.moveBy(1, 0, 0);

            // if illegal, undo and lock piece instead
            if (!this.activePiece!.isInBounds() || this.activePiece.intersectsBoard(this.isolatedBoard)) {
                this.activePiece.moveBy(-1, 0, 0);
                this.activePiece.blitToBoard(this.isolatedBoard);
                this.activePiece = undefined;
                this.placementFrameCount = 0;
            }
        }

    }

}