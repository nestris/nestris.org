import { TetrisBoard } from "../../../shared/tetris/tetris-board";
import { GlobalState } from "../global-state";
import { OCRFrame } from "../ocr-frame";
import { OCRState, StateEvent } from "../ocr-state";
import { OCRStateID } from "./ocr-state-id";
import MoveableTetromino from "../../../shared/tetris/moveable-tetromino";
import { ConsecutivePersistenceStrategy } from "../persistence-strategy";

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

    private validPlacement: MoveableTetromino | undefined = undefined;

    constructor(private readonly myState: PieceDroppingState, private readonly globalState: GlobalState) {
        
        // We require two consecutive valid frames to trigger this event
        super(
            "RegularSpawnEvent",
            new ConsecutivePersistenceStrategy(2)
        );
    }

    /**
     * This event happens when the current board's mino count is 8 or more the StableBoard's mino count, and
     * if previously-placed piece is a valid tetromino in a valid placement, the precondition is met. We do
     * not care if the dropping piece is valid, because interlacing may alter the dropping piece's shape.
     */
    protected override precondition(ocrFrame: OCRFrame): boolean {

        // State must have been running for at least 5 frames before we even consider this event
        if (this.myState.getRelativeFrameCount() < 5) return false;

        // Next box piece must be valid
        if (ocrFrame.getNextType() === undefined) return false;

        const stableCount = this.globalState.game!.getStableBoardCount();
        const currentCount = ocrFrame.getBinaryBoard()!.count();

        // If the current board has less than 8 minos, it means that the new piece has not spawned yet
        if (currentCount < stableCount + 8) return false;

        // We subtract stable board from current board, which should result in only the previous placement
        // and the spawned piece on the board. This is a perfect subtraction, and if it fails, it is not a 
        // valid spawn event.
        const diffBoard = TetrisBoard.subtract(ocrFrame.getBinaryBoard()!, this.globalState.game!.getStableBoard(), true);
        if (diffBoard === null) return false;

        // There should be exactly two connected components in the diff board: the placed piece and the new piece
        const cc = diffBoard.extractAllConnectedComponents();
        if (cc.length !== 2) return false;

        // Check that exactly one of the connected components is a valid placement with correct tetromino type
        let validPlacement: MoveableTetromino | undefined = undefined;
        for (const component of cc) {
            const mt = MoveableTetromino.extractFromTetrisBoard(component);
            if (mt !== null && mt.tetrominoType === this.globalState.game!.getCurrentType()) {
                // If we have already found a valid placement, then this is not a valid spawn event
                if (validPlacement !== undefined) return false;

                // Otherwise, this is a valid placement
                validPlacement = mt;
            }
        }
        // If we did not find a valid placement, then this is not a valid spawn event
        if (validPlacement === undefined) return false;

        // We have a valid placement
        this.validPlacement = validPlacement;
        return true;
    }

    /**
     * This event triggers the piece placement of the previous piece, and updates the stable board to reflect
     * the new piece placement.
     */
    override triggerEvent(ocrFrame: OCRFrame): OCRStateID | undefined {

        // Update the stable board to reflect the new piece placement and report the placement of the previous piece
        this.globalState.placePiece(this.validPlacement!, ocrFrame.getNextType()!);

        // We transition to a new instance of the same state
        return OCRStateID.PIECE_DROPPING;
    }

}