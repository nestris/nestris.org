import { GlobalState } from "../global-state";
import { OCRFrame } from "../ocr-frame";
import { OCRState, StateEvent } from "../ocr-state";
import { OCRStateID } from "./ocr-state-id";

export class PieceDroppingState extends OCRState {
        
    constructor(globalState: GlobalState) {
        super(OCRStateID.PIECE_DROPPING, globalState);

        this.registerEvent(new RegularSpawnEvent(this, globalState));
    }

    /**
     * Runs the logic for the BeforeGameState each frame.
     * @param gameData 
     * @param ocrFrame 
     */
    protected override onAdvanceFrame(ocrFrame: OCRFrame): void {
        if (this.globalState.game === undefined) throw new Error("Game must be defined in PieceDroppingState");
    }
}

/**
 * Event that triggers when a new piece is spawned without a line clear. This should result in the previous
 * piece being placed, and updating the stable board to reflect the placed piece.
 */
export class RegularSpawnEvent extends StateEvent {

    constructor(private readonly myState: PieceDroppingState, private readonly globalState: GlobalState) {
        super("RegularSpawnEvent");
    }

    /**
     * This event happens when the current board's mino count is 8 or more the StableBoard's mino count, and
     * if previously-placed piece is a valid tetromino in a valid placement, the precondition is met. We do
     * not care if the dropping piece is valid, because interlacing may alter the dropping piece's shape.
     */
    protected override precondition(ocrFrame: OCRFrame): boolean {

        // State must have been running for at least 5 frames before we even consider this event
        if (this.myState.getRelativeFrameCount() < 5) return false;

        const stableCount = this.globalState.game!.getStableBoardCount();
        const currentCount = ocrFrame.getBinaryBoard()!.count();

        // If the current board has less than 8 minos, it means that the new piece has not spawned yet
        if (currentCount < stableCount + 8) return false;

        return true;
    }

    /**
     * This event triggers the piece placement of the previous piece, and updates the stable board to reflect
     * the new piece placement.
     */
    override triggerEvent(ocrFrame: OCRFrame): OCRStateID | undefined {

        // Update the stable board to reflect the new piece placement
        // TODO

        // Report the placement of the previous piece
        // TODO

        // We transition to a new instance of the same state
        return OCRStateID.PIECE_DROPPING;
    }

}