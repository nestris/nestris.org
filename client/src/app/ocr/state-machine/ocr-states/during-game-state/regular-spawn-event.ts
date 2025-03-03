import { GlobalState } from "../../../state-machine/global-state";
import MoveableTetromino from "../../../../shared/tetris/moveable-tetromino";
import { StateEvent } from "../../../state-machine/ocr-state";
import { PieceDroppingState } from "./during-game-state";
import { ConsecutivePersistenceStrategy } from "../../../state-machine/persistence-strategy";
import { TetrisBoard } from "../../../../shared/tetris/tetris-board";
import { OCRFrame } from "../../../state-machine/ocr-frame";
import { OCRStateID } from "../ocr-state-id";
import { TETROMINO_CHAR } from "../../../../shared/tetris/tetrominos";
import { LogType } from "../../state-machine-logger";

/**
 * Event that triggers when a new piece is spawned without a line clear. This should result in the previous
 * piece being placed, and updating the stable board to reflect the placed piece.
 */
export class RegularSpawnEvent extends StateEvent {
    public override readonly persistence = new ConsecutivePersistenceStrategy(2);

    private validPlacement: MoveableTetromino | undefined = undefined;

    constructor(
        private readonly myState: PieceDroppingState,
        private readonly globalState: GlobalState
    ) { super(); }

    /**
     * This event happens when the current board's mino count is 8 or more the StableBoard's mino count, and
     * if previously-placed piece is a valid tetromino in a valid placement, the precondition is met. We do
     * not care if the dropping piece is valid, because interlacing may alter the dropping piece's shape.
     */
    protected override async precondition(ocrFrame: OCRFrame): Promise<boolean> {

        // State must have been running for at least 5 frames before we even consider this event
        if (this.myState.getRelativeFrameCount() < 5) {
            this.myState.textLogger.log(LogType.VERBOSE, "RegularSpawnEvent: Not enough frames have passed");
            return false;
        }

        // Next box piece must be valid
        if (ocrFrame.getNextType() === undefined) {
            this.myState.textLogger.log(LogType.VERBOSE, "RegularSpawnEvent: Next piece is undefined");
            return false;
        }

        const stableCount = this.globalState.game!.getStableBoardCount();
        const currentCount = ocrFrame.getBinaryBoard()!.count();

        // If the current board has less than 8 minos, it means that the new piece has not spawned yet
        if (currentCount < stableCount + 8) {
            this.myState.textLogger.log(LogType.VERBOSE, `RegularSpawnEvent: need at least ${stableCount + 8} minos, got ${currentCount}`);
            return false;
        }

        // We subtract stable board from current board, which should result in only the previous placement
        // and the spawned piece on the board. This is a perfect subtraction, and if it fails, it is not a 
        // valid spawn event.
        const diffBoard = TetrisBoard.subtract(ocrFrame.getBinaryBoard()!, this.globalState.game!.getStableBoard(), true);
        if (diffBoard === null) {
            this.myState.textLogger.log(LogType.VERBOSE, "RegularSpawnEvent: Failed to subtract stable board from current board");
            return false;
        }

        // There should be exactly two connected components in the diff board: the placed piece and the new piece
        const cc = diffBoard.extractAllConnectedComponents();
        if (cc.length !== 2) {
            this.myState.textLogger.log(LogType.VERBOSE, "RegularSpawnEvent: Invalid number of connected components (expected 2, got " + cc.length + ")");
            return false;
        }

        // Check that exactly one of the connected components is a valid placement with correct tetromino type
        let validPlacement: MoveableTetromino | undefined = undefined;
        for (const component of cc) {
            const mt = MoveableTetromino.extractFromTetrisBoard(component);
            if (
                mt !== null &&
                mt.tetrominoType === this.globalState.game!.getCurrentType() &&
                mt.isValidPlacement(this.globalState.game!.getStableBoard())
            ) {
                // If we have already found a valid placement, then this is not a valid spawn event
                if (validPlacement !== undefined) {
                    this.myState.textLogger.log(LogType.VERBOSE, "RegularSpawnEvent: Found multiple valid placements from connected components");
                    return false;
                }

                // Otherwise, this is a valid placement
                validPlacement = mt;
            }
        }
        // If we did not find a valid placement, then this is not a valid spawn event
        if (validPlacement === undefined) {
            this.myState.textLogger.log(LogType.VERBOSE, "RegularSpawnEvent: Did not find a valid placement from connected components");
            return false;
        }

        // We have a valid placement
        this.validPlacement = validPlacement;
        this.myState.textLogger.log(LogType.VERBOSE, "RegularSpawnEvent: Found valid placement");
        return true;
    }

    /**
     * This event triggers the piece placement of the previous piece, and updates the stable board to reflect
     * the new piece placement.
     */
    override async triggerEvent(ocrFrame: OCRFrame): Promise<OCRStateID | undefined> {

        // Look for pushdown. If the OCR'ed score is not more than 50 more than stable score, consider it as pushdown
        const stableScore = this.globalState.game!.getStatus().score;
        const pushdown = await calculatePushdown(ocrFrame, stableScore);

        // Update the stable board to reflect the new piece placement and report the placement of the previous piece
        this.globalState.game!.placePiece(this.validPlacement!, ocrFrame.getNextType()!, pushdown);
        this.myState.textLogger.log(LogType.INFO, `RegularSpawnEvent: Placed ${TETROMINO_CHAR[this.validPlacement!.tetrominoType]} at ${this.validPlacement!.getTetrisNotation()}`);

        // We transition to a new instance of the same state
        return OCRStateID.PIECE_DROPPING;
    }

}

export async function calculatePushdown(ocrFrame: OCRFrame, stableScore: number): Promise<number> {
    const ocrScore = (await ocrFrame.getScore())!;
    if (ocrScore !== -1 && ocrScore > stableScore && ocrScore < stableScore + 50) {
        return ocrScore - stableScore;
    }
    return 0;
}