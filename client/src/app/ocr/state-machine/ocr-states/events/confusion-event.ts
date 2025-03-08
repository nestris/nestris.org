import { StateEvent } from "../../ocr-state";
import { PieceDroppingState } from "./during-game-state";
import { TimedPersistenceStrategy } from "../../persistence-strategy";
import { OCRFrame } from "../../ocr-frame";
import { OCRStateID } from "../ocr-state-id";

/**
 * If a single PieceDroppingState doesn't find an active piece for a while, we send to limbo event for
 * possible recovery or game end.
 */
export class ConfusionEvent extends StateEvent {
    public override readonly name = "ConfusionEvent";
    public override readonly persistence = new TimedPersistenceStrategy(2000);

    constructor(private readonly myState: PieceDroppingState) { super() }

    /**
     * If the active piece found in an earlier frame does not show up again for a long time, or if the
     * active piece doesn't show up at all for a long time since the piece started dropping, then it is confused.
     */
    protected override async precondition(ocrFrame: OCRFrame): Promise<boolean> {

        // If we do find the active piece at any point, then it is not confused
        if (this.myState.getActivePieceThisFrame()) return false;

        // If no active piece found, it could be confused. Note that this must be true for a persistence for it to 
        // be truly confused
        return true;
    };

    /**
     * On confusion, go to limbo
     */
    override async triggerEvent(ocrFrame: OCRFrame): Promise<OCRStateID | undefined> {
        return OCRStateID.GAME_LIMBO;
    }

}