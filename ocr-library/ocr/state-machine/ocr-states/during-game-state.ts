import { TetrisBoard } from "../../../shared/tetris/tetris-board";
import { GlobalState } from "../global-state";
import { OCRFrame } from "../ocr-frame";
import { OCRState, StateEvent } from "../ocr-state";
import { OCRStateID } from "./ocr-state-id";
import MoveableTetromino from "../../../shared/tetris/moveable-tetromino";
import { ConsecutivePersistenceStrategy } from "../persistence-strategy";
import { TextLogger } from "../state-machine-logger";
import { TETROMINO_CHAR } from "../../../shared/tetris/tetrominos";

export class PieceDroppingState extends OCRState {

    // The last known good position of the active piece, calculated by doing a perfect subtraction of stable board
    // from the current board
    private activePiece: MoveableTetromino | undefined = undefined;
        
    constructor(globalState: GlobalState, textLogger: TextLogger) {
        super(OCRStateID.PIECE_DROPPING, globalState, textLogger);

        this.registerEvent(new RegularSpawnEvent(this, globalState));
    }

    /**
     * Runs the logic for the BeforeGameState each frame.
     * @param gameData 
     * @param ocrFrame 
     */
    protected override onAdvanceFrame(ocrFrame: OCRFrame): void {
        if (this.globalState.game === undefined) throw new Error("Game must be defined in PieceDroppingState");

        this.computeActivePiece(ocrFrame);

    }

    /**
     * We attempt to update the location of the active piece this frame. This is done by subtracting the stable
     * board from the current board, and checking if the result is a valid MoveableTetromino that matches the
     * current piece type. A known activePiece is not guaranteed to found at any frame, but can be useful
     * to help determine the final placement of the falling piece, though a fallback is necessary if not found.
     * Note that if the active piece is not found this frame, it is not overwritten.
     * @param ocrFrame The current OCR frame to use for updating the active piece
     */
    private computeActivePiece(ocrFrame: OCRFrame) {
        
        // If the current board's count is not exactly 4 minos more than the stable board, then we cannot determine
        // the active piece
        const stableCount = this.globalState.game!.getStableBoardCount();
        const currentCount = ocrFrame.getBinaryBoard()!.count();
        if (currentCount !== stableCount + 4) {
            this.textLogger.log("Active piece not updated: Current board count is not 4 more than stable board count");
            return;
        }

        // Do a perfect subtraction, subtracting the stable board from the current board to get the active piece
        const diffBoard = TetrisBoard.subtract(ocrFrame.getBinaryBoard()!, this.globalState.game!.getStableBoard(), true);
        if (diffBoard === null) {
            this.textLogger.log("Active piece not updated: Failed to subtract stable board from current board");
            return;
        }

        // Extract the active piece from the diff board, if it exists
        const mt = MoveableTetromino.extractFromTetrisBoard(diffBoard);
        if (mt === null) {
            this.textLogger.log("Active piece not updated: Failed to extract MoveableTetromino from diff board");
            return;
        }

        // Check that the extracted piece is of the correct type
        if (mt.tetrominoType !== this.globalState.game!.getCurrentType()) {
            this.textLogger.log("Active piece not updated: Extracted piece is not of the correct type");
            return;
        }

        // We have found a valid active piece
        this.activePiece = mt;
        this.textLogger.log(`Active piece updated: ${TETROMINO_CHAR[mt.tetrominoType]} at ${mt.getTetrisNotation()}`);
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
        if (this.myState.getRelativeFrameCount() < 5) {
            this.myState.textLogger.log("RegularSpawnEvent: Not enough frames have passed");
            return false;
        }

        // Next box piece must be valid
        if (ocrFrame.getNextType() === undefined) {
            this.myState.textLogger.log("RegularSpawnEvent: Next piece is undefined");
            return false;
        }

        const stableCount = this.globalState.game!.getStableBoardCount();
        const currentCount = ocrFrame.getBinaryBoard()!.count();

        // If the current board has less than 8 minos, it means that the new piece has not spawned yet
        if (currentCount < stableCount + 8) {
            this.myState.textLogger.log("RegularSpawnEvent: Not enough minos on the board");
            return false;
        }

        // We subtract stable board from current board, which should result in only the previous placement
        // and the spawned piece on the board. This is a perfect subtraction, and if it fails, it is not a 
        // valid spawn event.
        const diffBoard = TetrisBoard.subtract(ocrFrame.getBinaryBoard()!, this.globalState.game!.getStableBoard(), true);
        if (diffBoard === null) {
            this.myState.textLogger.log("RegularSpawnEvent: Failed to subtract stable board from current board");
            return false;
        }

        // There should be exactly two connected components in the diff board: the placed piece and the new piece
        const cc = diffBoard.extractAllConnectedComponents();
        if (cc.length !== 2) {
            this.myState.textLogger.log("RegularSpawnEvent: Invalid number of connected components (expected 2, got " + cc.length + ")");
            return false;
        }

        // Check that exactly one of the connected components is a valid placement with correct tetromino type
        let validPlacement: MoveableTetromino | undefined = undefined;
        for (const component of cc) {
            const mt = MoveableTetromino.extractFromTetrisBoard(component);
            if (mt !== null && mt.tetrominoType === this.globalState.game!.getCurrentType()) {
                // If we have already found a valid placement, then this is not a valid spawn event
                if (validPlacement !== undefined) {
                    this.myState.textLogger.log("RegularSpawnEvent: Found multiple valid placements from connected components");
                    return false;
                }

                // Otherwise, this is a valid placement
                validPlacement = mt;
            }
        }
        // If we did not find a valid placement, then this is not a valid spawn event
        if (validPlacement === undefined) {
            this.myState.textLogger.log("RegularSpawnEvent: Did not find a valid placement from connected components");
            return false;
        }

        // We have a valid placement
        this.validPlacement = validPlacement;
        this.myState.textLogger.log("RegularSpawnEvent: Found valid placement");
        return true;
    }

    /**
     * This event triggers the piece placement of the previous piece, and updates the stable board to reflect
     * the new piece placement.
     */
    override triggerEvent(ocrFrame: OCRFrame): OCRStateID | undefined {

        // Update the stable board to reflect the new piece placement and report the placement of the previous piece
        this.globalState.placePiece(this.validPlacement!, ocrFrame.getNextType()!);
        this.myState.textLogger.log(`RegularSpawnEvent: Placed ${TETROMINO_CHAR[this.validPlacement!.tetrominoType]} at ${this.validPlacement!.getTetrisNotation()}`);

        // We transition to a new instance of the same state
        return OCRStateID.PIECE_DROPPING;
    }

}