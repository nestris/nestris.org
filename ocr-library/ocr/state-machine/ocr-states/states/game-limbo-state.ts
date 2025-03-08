import MoveableTetromino from "src/app/shared/tetris/moveable-tetromino";
import { GlobalState } from "../../global-state";
import { OCRFrame } from "../../ocr-frame";
import { OCRState, StateEvent } from "../../ocr-state";
import { ConsecutivePersistenceStrategy, SingleFramePersistenceStrategy, TimedPersistenceStrategy } from "../../persistence-strategy";
import { TextLogger } from "../../state-machine-logger";
import { NOISE_THRESHOLD } from "./before-game-state";
import { OCRStateID } from "../ocr-state-id";
import { RestartGameEvent } from "../events/restart-game-event";
import { TetrisBoard } from "src/app/shared/tetris/tetris-board";
import { GameRecoverySchema } from "src/app/shared/network/stream-packets/packet";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";
import { Counter } from "src/app/shared/scripts/counter";
import { RecoveryEvent } from "../events/recovery-event";
import { SmartGameStatus } from "src/app/shared/tetris/smart-game-status";

export class GameLimboState extends OCRState {
    public override readonly id = OCRStateID.GAME_LIMBO;

    private ocrCounter = new Counter(20);
    private next: TetrominoType = this.globalState.game!.getNextType();
    public predictedLevel = this.globalState.game!.getStatus().level;
    public predictedLines = this.globalState.game!.getStatus().lines;
    public predictedScore = this.globalState.game!.getStatus().score;

    public override init() {

        this.registerEvent(new RestartGameEvent(this.config, this.globalState, this.textLogger));
        this.registerEvent(new RecoveryEvent(this.globalState, this));
        this.registerEvent(new ExitEvent());
        this.registerEvent(new TimeoutEvent());
    }

    /**
     * Runs the logic for the BeforeGameState each frame.
     * @param gameData 
     * @param ocrFrame 
     */
    protected override async onAdvanceFrame(ocrFrame: OCRFrame) {

        // Poll for next, level, lines, and score every few frames to avoid too much computation
        if (this.ocrCounter.next()) {
            const next = ocrFrame.getNextType()!;
            if (next !== TetrominoType.ERROR_TYPE) this.next = next;

            // Only attempt calc if not capped
            if (!this.globalState.game!.profile.isMaxoutCapped) {
                await this.updateCounters(ocrFrame);                
            }
        }

        // As we have no guarantees about what is going on, just keep sending the raw OCR board each frame
        this.globalState.game!.setFullState(
            ocrFrame.getColorBoard(this.predictedLevel)!,
            this.next,
            this.predictedLevel,
            this.predictedLines,
            this.predictedScore,
        );
    }

    /**
     * Try to derive score, level and lines. Because each of these rollover/cap, try to derive if needed
     */
    private async updateCounters(ocrFrame: OCRFrame) {

        const previousLevel = this.predictedLevel;
        const previousLines = this.predictedLines;
        const previousScore = this.predictedScore;

        // Derive new lines
        if (this.predictedLines < 996) {
            // If before lines rollover, read all 3 digits. Can only skip up to 4 lines, or OCR will break
            let ocrLines = (await ocrFrame.getLines(false))!
            if (ocrLines !== -1 && ocrLines > this.predictedLines && ocrLines <= this.predictedLines + 4) {
                this.predictedLines = ocrLines;
            }
        } else {
            // Already at lines rollover. Read only the last two digits
            let ocrLines = (await ocrFrame.getLines(true))!
            if (ocrLines !== -1) {
                ocrLines += (Math.floor(this.predictedLines / 100) * 100);

                // This happens when wraparound i.e. 1199 => 1200, because 0 < 99
                if (ocrLines < this.predictedLines) ocrLines += 100;

                // Can only advance a maximum of 4 lines, or OCR will break
                if (ocrLines > this.predictedLines && ocrLines - this.predictedLines <= 4) this.predictedLines = ocrLines;
            }
        }

        // New level if lines overflow in ones digit
        if (this.predictedLines % 10 < previousLines % 10) this.predictedLevel++;

        // Derive new score
        if (this.predictedScore < 960000) {
            // If before maxout, read all 6 digits. Can only skip up to 100,000 points, or OCR will break
            let ocrScore = (await ocrFrame.getScore(false))!
            if (ocrScore !== -1 && ocrScore > this.predictedScore && ocrScore < this.predictedScore + 100000) {
                this.predictedScore = ocrScore;
            }
        } else if (this.predictedLines > previousLines) {
            // Calculate score purely from lines increase
            const status = new SmartGameStatus(this.globalState.game!.startLevel, previousLines, previousScore, previousLevel);
            status.onLineClear(this.predictedLines - previousLines);
            this.predictedScore = status.score;
        }

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
        console.log("board noise", noise);
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