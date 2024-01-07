import { Observable, Subject } from "rxjs";
import { RNG } from "../../models/piece-sequence-generation/rng";
import { SmartGameStatus } from "../../models/scoring/smart-game-status";
import { getGravity } from "../../models/tetris/gravity";
import MoveableTetromino from "../../models/tetris/moveable-tetromino";
import { TetrisBoard } from "../../models/tetris/tetris-board";
import { TetrominoType } from "../../models/tetris/tetromino-type";
import { CurrentlyPressedKeys } from "./currently-pressed-keys";
import { Keybind } from "./keybinds";
import { getSpawnDelay } from "./spawn-delay";
import { IGameStatus } from "../../models/scoring/game-status";

export class EmulatorGameState {

    private isolatedBoard: TetrisBoard = new TetrisBoard();
    private status: SmartGameStatus;

    private currentPieceType: TetrominoType;
    private nextPieceType: TetrominoType;

    private activePiece?: MoveableTetromino;
    
    private currentDAS = 0;

    private toppedOut = false;

    private readonly MAX_DAS = 16;
    private readonly RESET_DAS = 10;

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

    getStatus(): IGameStatus {
        return this.status;
    }

    getTrt(): number {
        return 0; // TODO: implement this
    }

    getDrought(): number {
        return 0; // TODO: implement this
    }

    isToppedOut(): boolean {
        return this.toppedOut;
    }

    // given the current state and a set of pressed keys, progress the state
    executeFrame(pressedKeys: CurrentlyPressedKeys) {

        // poll currently pressed keys for this frame
        pressedKeys.tick();


        if (this.toppedOut) return;

        // spawn delay; do nothing
        if (this.placementFrameCount < this.spawnDelayFrames) {
            // do nothng
        } else if (this.placementFrameCount === this.spawnDelayFrames) {
            // spawn piece
            this.activePiece = MoveableTetromino.fromSpawnPose(this.currentPieceType);

            // if piece is illegal, game over
            if (this.activePiece.intersectsBoard(this.isolatedBoard)) {
                this.toppedOut = true;
                this.activePiece.blitToBoard(this.isolatedBoard);
                this.activePiece = undefined;
            }

        } else { // falling piece

            if (this.activePiece === undefined) throw new Error("inconsistent state: active piece should be defined");

            // attempt the shift/rotation, undo if illegal
            const attemptMove = (dr: number, dt: number) => {
                this.activePiece!.moveBy(dr, dt, 0);
                if (!this.activePiece!.isInBounds() || this.activePiece!.intersectsBoard(this.isolatedBoard)) {
                    this.activePiece!.moveBy(-dr, -dt, 0);
                }
            }

            // attempt translate if key is pressed
            if (pressedKeys.isJustPressed(Keybind.SHIFT_LEFT)) attemptMove(0, -1);
            else if (pressedKeys.isJustPressed(Keybind.SHIFT_RIGHT)) attemptMove(0, 1);

            // DAS
            const leftPressed = pressedKeys.isPressed(Keybind.SHIFT_LEFT);
            const rightPressed = pressedKeys.isPressed(Keybind.SHIFT_RIGHT);
            if (leftPressed || rightPressed) {
                this.currentDAS++;

                if (this.currentDAS >= this.MAX_DAS) {
                    attemptMove(0, leftPressed ? -1 : 1);
                    this.currentDAS = this.RESET_DAS;
                }

            }
            else {
                this.currentDAS = 0;
            }
            
            // attempt rotate if key is pressed
            if (pressedKeys.isJustPressed(Keybind.ROTATE_LEFT)) console.log("rotate left");
            if (pressedKeys.isJustPressed(Keybind.ROTATE_LEFT)) attemptMove(-1, 0);
            else if (pressedKeys.isJustPressed(Keybind.ROTATE_RIGHT)) attemptMove(1, 0);

            // gravity
            if ((this.placementFrameCount - this.spawnDelayFrames + 1) % getGravity(this.status.level) === 0) {
                
                // attempt moving piece downwards
                this.activePiece.moveBy(0, 0, 1);

                // if illegal, undo and lock piece instead
                if (!this.activePiece!.isInBounds() || this.activePiece.intersectsBoard(this.isolatedBoard)) {
                    this.activePiece.moveBy(0, 0, -1); // undo piece drop
                    this.activePiece.blitToBoard(this.isolatedBoard); // lock piece
                    this.activePiece = undefined; // clear active piece
                    this.placementFrameCount = -1; // reset placement frame counter

                    // set current piece to next box and generate new piece
                    this.currentPieceType = this.nextPieceType;
                    this.nextPieceType = this.rng.getNextPiece();
                }
            }
        }

        // increment placement frame counter
        this.placementFrameCount++;

    }

}