import { RNG } from "src/app/models/piece-sequence-generation/rng";
import { getGravity } from "src/app/shared/tetris/gravity";
import MoveableTetromino from "src/app/shared/tetris/moveable-tetromino";
import { TetrisBoard } from "src/app/shared/tetris/tetris-board";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";
import { CurrentlyPressedKeys } from "./currently-pressed-keys";
import { Keybind } from "./keybinds";
import { getLockDelay } from "./spawn-delay";
import { SmartGameStatus } from "src/app/shared/tetris/smart-game-status";
import { IGameStatus } from "src/app/shared/tetris/game-status";


export const EMULATOR_FPS = 60;

export interface EmulatorFrameInfo {
    toppedOut: boolean;
    newPieceSpawned: boolean;
    lockedPiece?: MoveableTetromino;
}

export class EmulatorGameState {
    
    // board without active piece
    private isolatedBoard: TetrisBoard = new TetrisBoard();

    // current lines/level/score
    private status: SmartGameStatus;


    // piece shown in next box
    private nextPieceType!: TetrominoType;

    // the pose of the moveable active piece
    private activePiece: MoveableTetromino;
    private pieceLocked: boolean = false;


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
        private countdown: number = 3, // how many seconds of countdown before game starts
    ) {
        this.status = new SmartGameStatus(startLevel);
        this.gravity = getGravity(this.status.level);

        // generate current piece
        this.activePiece = MoveableTetromino.fromSpawnPose(this.rng.getNextPiece());

        // generate new next piece
        this.nextPieceType = this.rng.getNextPiece();
    }

    // used only for copy() operation. should not be used otherwise
    _setState(
        isolatedBoard: TetrisBoard,
        status: SmartGameStatus,
        nextPieceType: TetrominoType,
        activePiece: MoveableTetromino,
        countdown: number,
        toppedOut: boolean = false,
        currentDAS: number = 0,
        placementFrameCount: number = 0,
        gravityCounter: number = 1,
        pieceLocked: boolean = false,
    ) {
        this.isolatedBoard = isolatedBoard;
        this.status = status;
        this.nextPieceType = nextPieceType;
        this.activePiece = activePiece;
        this.countdown = countdown;
        this.toppedOut = toppedOut;
        this.currentDAS = currentDAS;
        this.placementFrameCount = placementFrameCount;
        this.gravityCounter = gravityCounter;
        this.pieceLocked = pieceLocked;
    }

    // generate a deep copy of full game state
    copy(): EmulatorGameState {
        const copy = new EmulatorGameState(this.startLevel, this.rng);
        copy._setState(
            this.isolatedBoard.copy(),
            this.status.copy(),
            this.nextPieceType,
            this.activePiece?.copy(),
            this.countdown,
            this.toppedOut,
            this.currentDAS,
            this.placementFrameCount,
            this.gravityCounter,
            this.pieceLocked,
        );
        return copy;
    }


    getDisplayBoard(): TetrisBoard {
        if (this.pieceLocked) return this.isolatedBoard;
        
        const displayBoard = this.isolatedBoard.copy();
        this.activePiece.blitToBoard(displayBoard);
        return displayBoard;
    }

    getIsolatedBoard(): TetrisBoard {
        return this.isolatedBoard;
    }

    getCurrentPieceType(): TetrominoType {
        return this.activePiece.tetrominoType;
    }
    

    getNextPieceType(): TetrominoType {
        return this.nextPieceType;
    }

    getStatus(): IGameStatus {
        return this.status;
    }

    isToppedOut(): boolean {
        return this.toppedOut;
    }

    getActivePiece(): MoveableTetromino | undefined {

        if (this.pieceLocked || this.toppedOut) return undefined;
        return this.activePiece;
    }

    getCountdown(): number | undefined {
        return this.countdown > 0 ? this.countdown : undefined;
    }

    private spawnNewPiece() {

        // reset gravity counter. not 0 because gravity is not applied on first frame
        this.gravityCounter = 1;

        // set active piece to spawn location of next piece
        this.activePiece = MoveableTetromino.fromSpawnPose(this.nextPieceType);
        this.pieceLocked = false;

        // generate new next piece
        this.nextPieceType = this.rng.getNextPiece();

        // if piece is illegal, game over
        if (this.activePiece.intersectsBoard(this.isolatedBoard)) {
            this.toppedOut = true;
            this.activePiece.blitToBoard(this.isolatedBoard);
            console.log("topped out");
            this.isolatedBoard.print();
        }
    }

    // attempts to move the active piece by dr, dt
    // return true if successful, false if illegal
    private attemptMove(dr: number, dt: number): boolean {
        if (this.pieceLocked) return false; // do nothing if no piece is locked
        
        this.activePiece.moveBy(dr, dt, 0);

        // if illegal, undo
        if (!this.activePiece.isInBoundsIgnoreTop() || this.activePiece.intersectsBoard(this.isolatedBoard)) {
            this.activePiece.moveBy(-dr, -dt, 0);
            return false;
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

        if (this.pieceLocked) return; // do nothing if no active piece

        // attempt moving piece downwards
        this.activePiece.moveBy(0, 0, 1);

        // if illegal, undo and lock piece instead
        if (!this.activePiece!.isInBoundsIgnoreTop() || this.activePiece.intersectsBoard(this.isolatedBoard)) {
            // console.log("piece locked");

            this.activePiece.moveBy(0, 0, -1); // undo piece drop

            this.activePiece.blitToBoard(this.isolatedBoard); // lock piece

            // reset placement frame counter, adding a lock delay before next piece spawns at placementFrameCount == 0
            this.placementFrameCount = 0 - getLockDelay(this.activePiece);

            this.pieceLocked = true; // clear active piece

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
    executeFrame(pressedKeys: CurrentlyPressedKeys): EmulatorFrameInfo {

        // do nothing on topout
        if (this.toppedOut) return {
            toppedOut: true,
            newPieceSpawned: false,
        }

        let newPieceSpawned = false;
        const oldActivePiece = this.activePiece;

        // on first frame, spawn piece
        if (this.placementFrameCount === 0 && this.pieceLocked) {
            this.spawnNewPiece();
            newPieceSpawned = true;
            if (this.toppedOut) return {
                toppedOut: true,
                newPieceSpawned: true,
            }; // if piece spawn causes topout, exit
        }

        // only update DAS/translation/rotation if piece is active (not during lock)
        if (this.placementFrameCount >= 0) {
            this.handleTranslate(pressedKeys);
            this.handleRotate(pressedKeys);
        }
        
        
        if (this.countdown > 0) {
            // if we're still in countdown before game start, do not drop piece
            
            if ((this.placementFrameCount+1) % EMULATOR_FPS === 0) {
                this.countdown--;
                console.log("countdown", this.countdown);
            }

        } else {
            // we're in normal gameplay now with pieces falling

            if (this.gravityCounter === 0) {
                // gravityCounter cycles mod gravity, so this only happens once every gravity frames
                this.handlePieceDrop();
            }

            // increment gravity counter. if pushdown, gravity is bounded at 2
            let gravity = this.gravity;
            if (pressedKeys.isPressed(Keybind.PUSHDOWN)) gravity = Math.min(2, gravity);
            this.gravityCounter = (this.gravityCounter + 1) % gravity;
    
        }

        // increment placement frame counter
        this.placementFrameCount++;

        return {
            toppedOut: false,
            newPieceSpawned: newPieceSpawned,
            lockedPiece: newPieceSpawned ? oldActivePiece : undefined,
        }
        
    }

}