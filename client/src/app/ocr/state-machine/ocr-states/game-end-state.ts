import { GlobalState } from "../global-state";
import { OCRFrame } from "../ocr-frame";
import { OCRState, StateEvent } from "../ocr-state";
import { OCRConfig } from "../ocr-state-machine";
import { SingleFramePersistenceStrategy } from "../persistence-strategy";
import { OCRStateID } from "./ocr-state-id";


export class GameEndState extends OCRState {
    public override readonly id = OCRStateID.GAME_END;

    private isFirstFrame: boolean = true;

    public override init(): void {
        this.registerEvent(new GameRestartEvent(this.config));
    }

    /**
     * On the first frame, set global state game to ended, which sends GameEnd packet to server
     */
    protected override onAdvanceFrame(ocrFrame: OCRFrame): void {
        if (this.isFirstFrame) this.globalState.endGame();
        else this.isFirstFrame = false;
    }

}

/**
 * Restart game immediately if config allows for multiple games
 */
class GameRestartEvent extends StateEvent {
    public override readonly name = "GameRestartEvent";
    public override readonly persistence = new SingleFramePersistenceStrategy();

    constructor(private readonly config: OCRConfig) { super(); }

    protected override async precondition(ocrFrame: OCRFrame): Promise<boolean> {
        return this.config.multipleGames;
    };

    override async triggerEvent(ocrFrame: OCRFrame): Promise<OCRStateID | undefined> {
        return OCRStateID.BEFORE_GAME;
    }
}