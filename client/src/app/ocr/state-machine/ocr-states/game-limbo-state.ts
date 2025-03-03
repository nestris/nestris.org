import { GlobalState } from "../global-state";
import { OCRFrame } from "../ocr-frame";
import { OCRState, StateEvent } from "../ocr-state";
import { ConsecutivePersistenceStrategy, TimedPersistenceStrategy } from "../persistence-strategy";
import { TextLogger } from "../state-machine-logger";
import { NOISE_THRESHOLD } from "./before-game-state";
import { OCRStateID } from "./ocr-state-id";
import { RestartGameEvent } from "./restart-game-event";

export class GameLimboState extends OCRState {
    public override readonly id = OCRStateID.GAME_LIMBO;

    public override init() {

        this.registerEvent(new RestartGameEvent(this.config.startLevel, this.globalState, this.textLogger));
        this.registerEvent(new ExitEvent());
        this.registerEvent(new TimeoutEvent());
    }

    /**
     * Runs the logic for the BeforeGameState each frame.
     * @param gameData 
     * @param ocrFrame 
     */
    protected override onAdvanceFrame(ocrFrame: OCRFrame): void {

    }
}

/**
 * If OCR does not detect a tetris board at all, end game.
 */
export class ExitEvent extends StateEvent {
    public override readonly persistence = new ConsecutivePersistenceStrategy(3);

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
    public override readonly persistence = new TimedPersistenceStrategy(3000);

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