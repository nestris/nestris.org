import { Observable, Subject } from "rxjs";
import { RNG } from "../../models/piece-sequence-generation/rng";
import { SmartGameStatus } from "../../models/scoring/smart-game-status";
import { getGravity } from "../../models/tetris/gravity";
import MoveableTetromino from "../../models/tetris/moveable-tetromino";
import { TetrisBoard } from "../../models/tetris/tetris-board";
import { TetrominoType } from "../../models/tetris/tetromino-type";
import { CurrentlyPressedKeys } from "./currently-pressed-keys";
import { Keybind } from "./keybinds";
import {  getLockDelay } from "./spawn-delay";
import { IGameStatus } from "../../models/scoring/game-status";

export class EmulatorGameState {
    
    // board without active piece
    private isolatedBoard: TetrisBoard = new TetrisBoard();

    // current lines/level/score
    private status: SmartGameStatus;

    // piece shown in next box
    private nextPieceType!: TetrominoType;

    // the pose of the moveable active piece
    private activePiece?: MoveableTetromino;

    // number of frames to wait before gravity kicks in for the very first piece
    private initialSpawnDelay = 10;

    // whether game is over
    private toppedOut = false;

    // current DAS charge
    private currentDAS = 0;

    // DAS settings
    private readonly MAX_DAS = 16;
    private readonly RESET_DAS = 10;

    // Number of frames since piece spawn
    private placementFrameCount: number = 0;

    constructor(
        public readonly startLevel: number,
        private readonly rng: RNG,
    ) {
        this.status = new SmartGameStatus(startLevel);
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

    private spawnNewPiece() {

        // set active piece to spawn location of next piece
        this.activePiece = MoveableTetromino.fromSpawnPose(this.nextPieceType);

        // generate new next piece
        this.nextPieceType = this.rng.getNextPiece();

        // if piece is illegal, game over
        if (this.activePiece.intersectsBoard(this.isolatedBoard)) {
            this.toppedOut = true;
            this.activePiece.blitToBoard(this.isolatedBoard);
            this.activePiece = undefined;
        }
    }

    // attempts to move the active piece by dr, dt
    private attemptMove(dr: number, dt: number) {
        if (this.activePiece === undefined) return; // do nothing if no active piece
        this.activePiece.moveBy(dr, dt, 0);

        // if illegal, undo
        if (!this.activePiece.isInBounds() || this.activePiece.intersectsBoard(this.isolatedBoard)) {
            this.activePiece.moveBy(-dr, -dt, 0);
        }
    }

    private handleTranslate(pressedKeys: CurrentlyPressedKeys) {
        // attempt translate if key is pressed
        if (pressedKeys.isJustPressed(Keybind.SHIFT_LEFT)) {
            this.attemptMove(0, -1);
            this.currentDAS = 0;
        }
        else if (pressedKeys.isJustPressed(Keybind.SHIFT_RIGHT)) {
            this.attemptMove(0, 1);
            this.currentDAS = 0;
        }

        // handle DAS for left/right
        const leftPressed = pressedKeys.isPressed(Keybind.SHIFT_LEFT);
        const rightPressed = pressedKeys.isPressed(Keybind.SHIFT_RIGHT);
        if (leftPressed || rightPressed) {
            this.currentDAS++;

            if (this.currentDAS >= this.MAX_DAS) {
                this.attemptMove(0, leftPressed ? -1 : 1);
                this.currentDAS = this.RESET_DAS;
            }
        }
        else {
            this.currentDAS = 0;
        }
    }

    private handleRotate(pressedKeys: CurrentlyPressedKeys) {
        // attempt rotate if key is pressed
        if (pressedKeys.isJustPressed(Keybind.ROTATE_LEFT)) this.attemptMove(-1, 0);
        else if (pressedKeys.isJustPressed(Keybind.ROTATE_RIGHT)) this.attemptMove(1, 0);
    }

    private handlePieceDrop() {

        if (this.activePiece === undefined) return; // do nothing if no active piece

        // attempt moving piece downwards
        this.activePiece.moveBy(0, 0, 1);

        // if illegal, undo and lock piece instead
        if (!this.activePiece!.isInBounds() || this.activePiece.intersectsBoard(this.isolatedBoard)) {
            console.log("piece locked");

            this.activePiece.moveBy(0, 0, -1); // undo piece drop

            this.activePiece.blitToBoard(this.isolatedBoard); // lock piece

            // reset placement frame counter, adding a lock delay before next piece spawns at placementFrameCount == 0
            this.placementFrameCount = 0 - getLockDelay(this.activePiece);

            this.activePiece = undefined; // clear active piece

            // FOR NOW: instant lineclears
            const linesCleared = this.isolatedBoard.processLineClears();
            console.log("lines cleared", linesCleared);
            this.status.onLineClear(linesCleared);
        }
    }

    // given the current state and a set of pressed keys, progress the state
    executeFrame(pressedKeys: CurrentlyPressedKeys) {

        // poll currently pressed keys for this frame
        pressedKeys.tick();

        // do nothing on topout
        if (this.toppedOut) return;

        // on first frame, spawn piece
        if (this.placementFrameCount === 0 && this.activePiece === undefined) {
            this.spawnNewPiece();
            if (this.toppedOut) return; // if piece spawn causes topout, exit
        }

        // only update DAS/translation/rotation if piece is active (not during lock)
        if (this.placementFrameCount >= 0) {
            this.handleTranslate(pressedKeys)
            this.handleRotate(pressedKeys)
        }
        
        
        if (this.initialSpawnDelay > 0) {
            // for the first few frames of the first piece ONLY, do not drop piece
            this.initialSpawnDelay--;
        } else {

            if ((this.placementFrameCount + 1) % getGravity(this.status.level) === 0) {
                // every [getGravity()] frames, drop piece
                this.handlePieceDrop();
            }
    
            // increment placement frame counter
            this.placementFrameCount++;
    
        }
        
    }

}