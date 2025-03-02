import { GlobalState } from "../global-state";
import { OCRFrame } from "../ocr-frame";
import { OCRState, StateEvent } from "../ocr-state";
import { TimedPersistenceStrategy } from "../persistence-strategy";
import { TextLogger } from "../state-machine-logger";
import { OCRStateID } from "./ocr-state-id";
import { RestartGameEvent } from "./restart-game-event";

export class GameLimboState extends OCRState {
    public override readonly id = OCRStateID.GAME_LIMBO;

    public override init() {

        this.registerEvent(new RestartGameEvent(this.config.startLevel, this.globalState, this.textLogger));
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
 * If been in limbo state for too long, game is unrecoverable. End game.
 */
export class TimeoutEvent extends StateEvent {
    public override readonly name = "TimeoutEvent";
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