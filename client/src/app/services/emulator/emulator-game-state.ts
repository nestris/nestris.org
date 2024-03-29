import { Observable, Subject } from "rxjs";
import { RNG } from "../../models/piece-sequence-generation/rng";
import { SmartGameStatus } from "../../models/scoring/smart-game-status";
import { getGravity } from "../../../../../network-protocol/tetris/gravity";
import MoveableTetromino from "../../../../../network-protocol/tetris/moveable-tetromino";
import { TetrisBoard } from "../../../../../network-protocol/tetris/tetris-board";
import { TetrominoType } from "../../../../../network-protocol/tetris/tetromino-type";
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
    private MAX_DAS = 16;
    private RESET_DAS = 10;

    // Number of frames since piece spawn
    private placementFrameCount: number = 0;

    private gravity: number;
    private gravityCounter = 1;

    constructor(
        public readonly startLevel: number,
        private readonly rng: RNG,
    ) {
        this.status = new SmartGameStatus(startLevel);
        this.nextPieceType = this.rng.getNextPiece();

        this.gravity = getGravity(this.status.level);
    }

    // used only for copy() operation. should not be used otherwise
    _setState(
        isolatedBoard: TetrisBoard,
        status: SmartGameStatus,
        nextPieceType: TetrominoType,
        activePiece?: MoveableTetromino,
        initialSpawnDelay: number = 10,
        toppedOut: boolean = false,
        currentDAS: number = 0,
        placementFrameCount: number = 0,
    ) {
        this.isolatedBoard = isolatedBoard;
        this.status = status;
        this.nextPieceType = nextPieceType;
        this.activePiece = activePiece;
        this.initialSpawnDelay = initialSpawnDelay;
        this.toppedOut = toppedOut;
        this.currentDAS = currentDAS;
        this.placementFrameCount = placementFrameCount;
    }

    // generate a deep copy of full game state
    copy(): EmulatorGameState {
        const copy = new EmulatorGameState(this.startLevel, this.rng);
        copy._setState(
            this.isolatedBoard.copy(),
            this.status.copy(),
            this.nextPieceType,
            this.activePiece?.copy(),
            this.initialSpawnDelay,
            this.toppedOut,
            this.currentDAS,
            this.placementFrameCount,
        );
        return copy;
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

    getCurrentDAS(): number {
        return this.currentDAS;
    }

    isToppedOut(): boolean {
        return this.toppedOut;
    }

    private spawnNewPiece() {

        // reset gravity counter. not 0 because gravity is not applied on first frame
        this.gravityCounter = 1;

        // set active piece to spawn location of next piece
        this.activePiece = MoveableTetromino.fromSpawnPose(this.nextPieceType);

        // generate new next piece
        this.nextPieceType = this.rng.getNextPiece();

        // if piece is illegal, game over
        if (this.activePiece.intersectsBoard(this.isolatedBoard)) {
            this.toppedOut = true;
            this.activePiece.blitToBoard(this.isolatedBoard);
            console.log("topped out");
            this.isolatedBoard.print();
            this.activePiece = undefined;
        }
    }

    // whether piece can move left/right. don't actually move piece
    private canMoveDirection(dt: number): boolean {
        if (this.activePiece === undefined) return false; // do nothing if no active piece
        
        // test move
        this.activePiece.moveBy(0, dt, 0);
        
        // get legality
        let legal;
        if (!this.activePiece.isInBounds() || this.activePiece.intersectsBoard(this.isolatedBoard)) {
            legal = false;
        } else {
            legal = true;
        }

        // undo move
        this.activePiece.moveBy(0, -dt, 0);

        return legal;
    }

    // attempts to move the active piece by dr, dt
    // return true if successful, false if illegal
    private attemptMove(dr: number, dt: number): boolean {
        if (this.activePiece === undefined) return false; // do nothing if no active piece
        
        this.activePiece.moveBy(dr, dt, 0);

        // if illegal, undo
        if (!this.activePiece.isInBounds() || this.activePiece.intersectsBoard(this.isolatedBoard)) {
            this.activePiece.moveBy(-dr, -dt, 0);
            return false;
        } else {
            // if (dr === -1) console.log("rotate left");
            // if (dr === 1) console.log("rotate right");
            // if (dt === -1) console.log("translate left");
            // if (dt === 1) console.log("translate right");
        }

        return true;
    }

    private handleTranslate(pressedKeys: CurrentlyPressedKeys) {

        // attempt translate if key is pressed
        if (pressedKeys.isJustPressed(Keybind.SHIFT_LEFT)) {
            // if legal, reset DAS. otherwise, set DAS to max (wall charge)
            this.currentDAS = this.attemptMove(0, -1) ? 0 : this.MAX_DAS;
        }
        else if (pressedKeys.isJustPressed(Keybind.SHIFT_RIGHT)) {
            // if legal, reset DAS. otherwise, set DAS to max (wall charge)
            this.currentDAS = this.attemptMove(0, 1) ? 0 : this.MAX_DAS;
        } else {

            // handle normal DAS for left/right
            const leftPressed = pressedKeys.isPressed(Keybind.SHIFT_LEFT);
            const rightPressed = pressedKeys.isPressed(Keybind.SHIFT_RIGHT);
            if (leftPressed || rightPressed) {
                this.currentDAS++;

                if (this.currentDAS >= this.MAX_DAS) {
                    // if successful shift, reset DAS. otherwise, set DAS to max (wall charge)
                    this.currentDAS = this.attemptMove(0, leftPressed ? -1 : 1) ? this.RESET_DAS : this.MAX_DAS;
                }
            }

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
            // console.log("piece locked");

            this.activePiece.moveBy(0, 0, -1); // undo piece drop

            this.activePiece.blitToBoard(this.isolatedBoard); // lock piece

            // reset placement frame counter, adding a lock delay before next piece spawns at placementFrameCount == 0
            this.placementFrameCount = 0 - getLockDelay(this.activePiece);

            this.activePiece = undefined; // clear active piece

            // FOR NOW: instant lineclears
            const linesCleared = this.isolatedBoard.processLineClears();
            // console.log("lines cleared", linesCleared);

            // update score/line/level count, and update gravity accordingly
            if (linesCleared > 0) {
                this.status.onLineClear(linesCleared);
                this.gravity = getGravity(this.status.level);
            }
            
        } else {
            // console.log("drop piece");
        }
    }

    // given the current state and a set of pressed keys, progress the state
    executeFrame(pressedKeys: CurrentlyPressedKeys) {

        // do nothing on topout
        if (this.toppedOut) return;

        // console.log("frame", this.placementFrameCount, pressedKeys.toString(), "DAS:", this.currentDAS);

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

            if (this.gravityCounter === 0) {
                // gravityCounter cycles mod gravity, so this only happens once every gravity frames
                this.handlePieceDrop();
            }
    
            // increment placement frame counter
            this.placementFrameCount++;

            // increment gravity counter. if pushdown, gravity is bounded at 2
            let gravity = this.gravity;
            if (pressedKeys.isPressed(Keybind.PUSHDOWN)) gravity = Math.min(2, gravity);
            this.gravityCounter = (this.gravityCounter + 1) % gravity;
    
        }
        
    }

}