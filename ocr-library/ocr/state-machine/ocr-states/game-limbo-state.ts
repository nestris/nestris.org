import MoveableTetromino from "src/app/shared/tetris/moveable-tetromino";
import { GlobalState } from "../global-state";
import { OCRFrame } from "../ocr-frame";
import { OCRState, StateEvent } from "../ocr-state";
import { ConsecutivePersistenceStrategy, SingleFramePersistenceStrategy, TimedPersistenceStrategy } from "../persistence-strategy";
import { TextLogger } from "../state-machine-logger";
import { NOISE_THRESHOLD } from "./before-game-state";
import { OCRStateID } from "./ocr-state-id";
import { RestartGameEvent } from "./restart-game-event";
import { TetrisBoard } from "src/app/shared/tetris/tetris-board";
import { GameRecoverySchema } from "src/app/shared/network/stream-packets/packet";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";
import { Counter } from "src/app/shared/scripts/counter";

export class GameLimboState extends OCRState {
    public override readonly id = OCRStateID.GAME_LIMBO;

    private ocrCounter = new Counter(10);
    private next: TetrominoType = this.globalState.game!.getNextType();
    private level = this.globalState.game!.getStatus().level;
    private lines = this.globalState.game!.getStatus().lines;
    private score = this.globalState.game!.getStatus().score;

    public override init() {

        this.registerEvent(new RestartGameEvent(this.config, this.globalState, this.textLogger));
        this.registerEvent(new RecoveryEvent(this.globalState));
        this.registerEvent(new ExitEvent());
        this.registerEvent(new TimeoutEvent());
    }

    /**
     * Runs the logic for the BeforeGameState each frame.
     * @param gameData 
     * @param ocrFrame 
     */
    protected override async onAdvanceFrame(ocrFrame: OCRFrame) {

        // If OCR text is less than the current value or -1, don't use, and use previous value
        const ignoreIfInvalid = (value: number, original: number) => (value === -1 || value < original) ? original : value;

        // Poll for next, level, lines, and score every few frames to avoid too much computation
        if (this.ocrCounter.next()) {
            const next = ocrFrame.getNextType()!;
            if (next !== TetrominoType.ERROR_TYPE) this.next = next;

            this.level = ignoreIfInvalid((await ocrFrame.getLevel())!, this.level);
            this.lines = ignoreIfInvalid((await ocrFrame.getLines())!, this.lines);
            this.score = ignoreIfInvalid((await ocrFrame.getScore())!, this.score);
        }

        // As we have no guarantees about what is going on, just keep sending the raw OCR board each frame
        this.globalState.game!.setFullState(
            ocrFrame.getColorBoard(this.level)!,
            this.next,
            this.level,
            this.lines,
            this.score,
        );
    }
}

/**
 * RecoveryEvent optimistically transitions Limbo -> PieceDropping state. It attempts to find a frame where
 * board can be isolated and activePiece found, with valid level, lines, and score that is equal or greater than
 * current game status.
 */
export class RecoveryEvent extends StateEvent {
    public override readonly name = "RecoveryEvent";
    public override readonly persistence = new SingleFramePersistenceStrategy();

    private previousSeperation: [MoveableTetromino, TetrisBoard] | null = null;

    private recovery?: GameRecoverySchema;

    constructor(
        private readonly globalState: GlobalState)
    { super(); }

    protected override async precondition(ocrFrame: OCRFrame): Promise<boolean> {

        // For now, disable recovery post-maxout, until text OCR supports over 1 million
        const status = this.globalState.game!.getMemoryStatus();
        if (status.score >= 999999) return false;

        // Try to seperate board from active piece
        const previousSeperation = this.previousSeperation;
        const board = ocrFrame.getColorBoard(this.globalState.game!.getStatus().level)!;
        const seperation = board.seperateBoardAndPiece();
        this.previousSeperation = seperation;

        // If cannot seperate, cannot recover this frame
        if (!seperation) { console.log("no seperation"); return false; }

        // Need to have consecutive valid seperations
        if (!previousSeperation) { console.log("no previous seperation"); return false; }

        const [previousPiece, previousIsolatedBoard] = previousSeperation;
        const [currentPiece, currentIsolatedBoard] = seperation;

        // The active piece must be of the same type
        if (previousPiece.tetrominoType !== currentPiece.tetrominoType) {
            console.log("not same type seperation");
            return false;
        }

        // The active piece must have moved while isolated board stayed the same
        if (previousPiece.equals(currentPiece) || !previousIsolatedBoard.equalsIgnoreColor(currentIsolatedBoard)) {
            console.log("active not move or isolated board move");
            return false;
        }

        // Valid next piece
        const next = ocrFrame.getNextType()!;
        if (next === TetrominoType.ERROR_TYPE) {
            console.log("invalid next piece");
            return false;
        }

        // Score, level, and lines must be valid and at least the current values
        const score = (await ocrFrame.getScore())!;
        if (score === -1 || score < status.score) return false;

        const lines = (await ocrFrame.getLines())!;
        if (lines === -1 || lines < status.lines) return false;

        const level = (await ocrFrame.getLevel())!;
        if (level === -1 || level < status.level) return false;

        this.recovery = {
            startLevel: status.startLevel,
            isolatedBoard: currentIsolatedBoard,
            current: currentPiece.tetrominoType,
            next, score, level, lines,
            countdown: 0
        }

        return true;
    };

    /**
     * On successful recovery, go back to normal game state
     */
    override async triggerEvent(ocrFrame: OCRFrame): Promise<OCRStateID | undefined> {

        // Recover game with current state
        this.globalState.game!.setRecovery(this.recovery!);

        // Transition back to normal piece drop
        return OCRStateID.PIECE_DROPPING;
    }

}

/**
 * If OCR does not detect a tetris board at all, end game.
 */
export class ExitEvent extends StateEvent {
    public override readonly name = "ExitEvent";
    public override readonly persistence = new ConsecutivePersistenceStrategy(5);

    /**
     * If noisy levels are high, that the board is showing is unlikely
     */
    protected override async precondition(ocrFrame: OCRFrame): Promise<boolean> {
        const noise = ocrFrame.getBoardNoise()!;
        return noise > NOISE_THRESHOLD;
    };

    /**
     * On reaching unrecoverable state, end game
     */
    override async triggerEvent(ocrFrame: OCRFrame): Promise<OCRStateID | undefined> {
        return OCRStateID.GAME_END;
    }

}

/**
 * If been in limbo state for too long, game is unrecoverable. End game.
 */
export class TimeoutEvent extends StateEvent {
    public override readonly name = "TimeoutEvent";
    public override readonly persistence = new TimedPersistenceStrategy(10000);

    /**
     * No preconditions besides the persistence threshold of the limbo state reached
     */
    protected override async precondition(ocrFrame: OCRFrame): Promise<boolean> {
        return true;
    };

    /**
     * On reaching unrecoverable state, end game
     */
    override async triggerEvent(ocrFrame: OCRFrame): Promise<OCRStateID | undefined> {
        return OCRStateID.GAME_END;
    }

}