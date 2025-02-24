import { TetrisBoard } from "../../../../shared/tetris/tetris-board";
import { GlobalState } from "../../global-state";
import { OCRFrame } from "../../ocr-frame";
import { OCRState } from "../../ocr-state";
import { OCRStateID } from "../ocr-state-id";
import MoveableTetromino from "../../../../shared/tetris/moveable-tetromino";
import { LogType, TextLogger } from "../../state-machine-logger";
import { TETROMINO_CHAR } from "../../../../shared/tetris/tetrominos";
import { RegularSpawnEvent } from "./regular-spawn-event";
import { LineClearSpawnEvent } from "./line-clear-spawn-event";
import { TopoutEvent } from "./topout-event";

export class PieceDroppingState extends OCRState {

    // The last known good position of the active piece, calculated by doing a perfect subtraction of stable board
    // from the current board
    private activePiece: MoveableTetromino | undefined = undefined;
    private activePieceThisFrame: MoveableTetromino | null = null;
        
    constructor(globalState: GlobalState, textLogger: TextLogger) {
        super(OCRStateID.PIECE_DROPPING, globalState, textLogger);

        this.registerEvent(new RegularSpawnEvent(this, globalState));
        this.registerEvent(new LineClearSpawnEvent(this, globalState));
        this.registerEvent(new TopoutEvent(this, globalState));
    }

    /**
     * Runs the logic for the BeforeGameState each frame.
     * @param gameData 
     * @param ocrFrame 
     */
    protected override onAdvanceFrame(ocrFrame: OCRFrame): void {
        if (this.globalState.game === undefined) throw new Error("Game must be defined in PieceDroppingState");

        // We attempt to compute the active piece for this frame
        this.activePieceThisFrame = this.computeActivePiece(ocrFrame);

        if (this.activePieceThisFrame) {
            // We only update the active piece if it was found this frame
            this.activePiece = this.activePieceThisFrame;

            // We use the found active piece this frame to send an abbreviated-length packet for just the active piece
            this.globalState.game!.setAbbreviatedBoard(this.activePieceThisFrame);
        } else {
            // We didn't find the active piece this frame, so we are forced to send the entire board state
            const colorBoard = ocrFrame.getBinaryBoard()!; // TODO: GET COLORS FROM OCR
            this.globalState.game!.setFullBoard(colorBoard);

        }

    }

    /**
     * We attempt to find the location of the active piece this frame. This is done by subtracting the stable
     * board from the current board, and checking if the result is a valid MoveableTetromino that matches the
     * current piece type. A known activePiece is not guaranteed to found at any frame, but can be useful
     * to help determine the final placement of the falling piece, though a fallback is necessary if not found.
     * @param ocrFrame The current OCR frame to use for updating the active piece
     */
    private computeActivePiece(ocrFrame: OCRFrame): MoveableTetromino | null {
        
        // If the current board's count is not exactly 4 minos more than the stable board, then we cannot determine
        // the active piece
        const stableCount = this.globalState.game!.getStableBoardCount();
        const currentCount = ocrFrame.getBinaryBoard()!.count();
        if (currentCount !== stableCount + 4) {
            this.textLogger.log(LogType.VERBOSE, "Active piece not updated: Current board count is not 4 more than stable board count");
            return null;
        }

        // Do a perfect subtraction, subtracting the stable board from the current board to get the active piece
        const diffBoard = TetrisBoard.subtract(ocrFrame.getBinaryBoard()!, this.globalState.game!.getStableBoard(), true);
        if (diffBoard === null) {
            this.textLogger.log(LogType.VERBOSE, "Active piece not updated: Failed to subtract stable board from current board");
            return null;
        }

        // Extract the active piece from the diff board, if it exists
        const mt = MoveableTetromino.extractFromTetrisBoard(diffBoard);
        if (mt === null) {
            this.textLogger.log(LogType.VERBOSE, "Active piece not updated: Failed to extract MoveableTetromino from diff board");
            return null;
        }

        // Check that the extracted piece is of the correct type
        if (mt.tetrominoType !== this.globalState.game!.getCurrentType()) {
            this.textLogger.log(LogType.VERBOSE, "Active piece not updated: Extracted piece is not of the correct type");
            return null;
        }

        // We have found a valid active piece
        this.textLogger.log(LogType.VERBOSE, `Active piece updated: ${TETROMINO_CHAR[mt.tetrominoType]} at ${mt.getTetrisNotation()}`);
        return mt;
    }

    /**
     * Returns the active piece, if it exists. The active piece is the piece that is currently falling
     * on the board. This piece is not guaranteed to be found every frame, and may be undefined.
     * @returns The active piece, if it exists
     */
    getActivePiece(): MoveableTetromino | undefined {
        return this.activePiece;
    }

    getActivePieceThisFrame(): MoveableTetromino | null {
        return this.activePieceThisFrame;
    }
}

