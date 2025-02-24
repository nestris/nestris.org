import { GlobalState } from "../../global-state";
import MoveableTetromino from "../../../../shared/tetris/moveable-tetromino";
import { StateEvent } from "../../ocr-state";
import { PieceDroppingState } from "./during-game-state";
import { ConsecutivePersistenceStrategy } from "../../persistence-strategy";
import { TetrisBoard } from "../../../../shared/tetris/tetris-board";
import { OCRFrame } from "../../ocr-frame";
import { OCRStateID } from "../ocr-state-id";
import { TETROMINO_CHAR } from "../../../../shared/tetris/tetrominos";
import { LogType } from "../../state-machine-logger";

/**
 * Event that triggers when a new piece is spawned without a line clear. This should result in the previous
 * piece being placed, and updating the stable board to reflect the placed piece.
 */
export class LineClearSpawnEvent extends StateEvent {

    private validPlacement: MoveableTetromino | undefined = undefined;

    constructor(private readonly myState: PieceDroppingState, private readonly globalState: GlobalState) {
        
        // We require two consecutive valid frames to trigger this event
        super(
            "LineClearSpawnEvent",
            new ConsecutivePersistenceStrategy(2)
        );
    }

    /**
     * This event happens when the current board's mino count is 8 or more the StableBoard's mino count, and
     * if previously-placed piece is a valid tetromino in a valid placement, the precondition is met. We do
     * not care if the dropping piece is valid, because interlacing may alter the dropping piece's shape.
     */
    protected override async precondition(ocrFrame: OCRFrame): Promise<boolean> {

        // State must have been running for at least 5 frames before we even consider this event
        if (this.myState.getRelativeFrameCount() < 5) {
            this.myState.textLogger.log(LogType.VERBOSE, "LineClearSpawnEvent: Not enough frames have passed");
            return false;
        }

        // Next box piece must be valid
        if (ocrFrame.getNextType() === undefined) {
            this.myState.textLogger.log(LogType.VERBOSE, "LineClearSpawnEvent: Next piece is undefined");
            return false;
        }

        const stableCount = this.globalState.game!.getStableBoardCount();
        const currentBoard = ocrFrame.getBinaryBoard()!;
        const currentCount = currentBoard.count();

        // Account for a line clear of 10+ minos, placed piece, and maximum of 6 mino spawned piece to account for interlacing
        if (currentCount > stableCount) {
            this.myState.textLogger.log(LogType.VERBOSE, `LineClearSpawnEvent: Need equal or less than ${stableCount} minos, got ${currentCount}`);
            return false;
        }

        // Attempt to extract the active piece, which should be the first connected component in the current board
        const cc = currentBoard.extractAllConnectedComponents();
        if (cc.length === 0) {
            this.myState.textLogger.log(LogType.VERBOSE, "LineClearSpawnEvent: No connected components found in current board");
            return false;
        }
        const ccCount = cc[0].count();
        if (ccCount < 4 || ccCount > 6) {
            this.myState.textLogger.log(LogType.VERBOSE, `LineClearSpawnEvent: Spawned piece not betweeen 4-6 minos (got ${cc[0].count()})`);
            return false;
        }

        this.myState.textLogger.log(LogType.VERBOSE, `LineClearSpawnEvent: Found possible spawn piece with ${cc[0].count()} minos`);

        // Remove the connected component from the current board to get the result of the placed piece + line
        // clear, without the spawned piece. This should be a perfect subtraction.
        const isolatedBoard = TetrisBoard.subtract(ocrFrame.getBinaryBoard()!, cc[0], true);
        if (isolatedBoard === null) {
            this.myState.textLogger.log(LogType.VERBOSE, "LineClearSpawnEvent: Failed to subtract spawned piece from current board");
            return false;
        }

        // Attempt to use the the active piece as the placement and see if it results in the isolated board
        const activePiecePlacement = this.checkActivePiecePlacement(isolatedBoard);
        if (activePiecePlacement) {
            this.validPlacement = activePiecePlacement;
            this.myState.textLogger.log(LogType.VERBOSE, "LineClearSpawnEvent: Found valid placement from active piece");
            return true;
        }

        // Try to find the placement through brute forcing all possible placements
        // TODO: Implement brute force placement

        // Failed to find a valid placement either both method
        return false;
    }

    /**
     * Check if the active piece is a valid placement, and if placing it on the stable board and clearing lines
     * would result in the isolated board.
     * @returns The placement, or undefined if the active piece is not a valid placement
     */
    private checkActivePiecePlacement(isolatedBoard: TetrisBoard): MoveableTetromino | undefined {

        // Get the active piece
        const activePiece = this.myState.getActivePiece();
        if (activePiece === undefined) {
            this.myState.textLogger.log(LogType.VERBOSE, "[ActivePiecePlacement] LineClearSpawnEvent: Active piece is undefined");
            return undefined;
        }

        // Check that the active piece is at a valid placement on the stable board
        const stableBoard = this.globalState.game!.getStableBoard();
        if (!activePiece.isValidPlacement(stableBoard)) {
            this.myState.textLogger.log(LogType.VERBOSE, `[ActivePiecePlacement] LineClearSpawnEvent: Active piece ${activePiece.getTetrisNotation()} is not a valid placement`);
            return undefined;
        }

        // Place the active piece on the stable board
        const stableBoardWithPiece = stableBoard.copy();
        activePiece.blitToBoard(stableBoardWithPiece);

        // Clear lines on the placed board. Since this is on a line-clearing place, we expect at least one line to be cleared
        const linesCleared = stableBoardWithPiece.processLineClears();
        if (linesCleared === 0) {
            this.myState.textLogger.log(LogType.VERBOSE, `[ActivePiecePlacement] LineClearSpawnEvent: Active piece ${activePiece.getTetrisNotation()} is a valid placement, but no lines were cleared`);
            return undefined;
        }

        // Check if the cleared board is equal to the isolated board
        if (!stableBoardWithPiece.equalsIgnoreColor(isolatedBoard)) {
            this.myState.textLogger.log(LogType.VERBOSE, `[ActivePiecePlacement] LineClearSpawnEvent: Placing active piece ${activePiece.getTetrisNotation()} does not result in isolated board`);
            return undefined;
        }

        // The active piece is a valid placement
        return activePiece;
    }

    /**
     * This event triggers the piece placement of the previous piece, and updates the stable board to reflect
     * the new piece placement.
     */
    override async triggerEvent(ocrFrame: OCRFrame): Promise<OCRStateID | undefined> {

        // Update the stable board to reflect the new piece placement and report the placement of the previous piece
        this.myState.textLogger.log(LogType.INFO, `RegularSpawnEvent: Placed ${TETROMINO_CHAR[this.validPlacement!.tetrominoType]} at ${this.validPlacement!.getTetrisNotation()}`);
        this.globalState.game!.placePiece(this.validPlacement!, ocrFrame.getNextType()!, this.myState.textLogger);

        // We transition to a new instance of the same state
        return OCRStateID.PIECE_DROPPING;
    }

}