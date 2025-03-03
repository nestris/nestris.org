import { ColorType, TetrisBoard } from "../../../../shared/tetris/tetris-board";
import { OCRFrame } from "../../ocr-frame";
import { OCRState } from "../../ocr-state";
import { OCRStateID } from "../ocr-state-id";
import MoveableTetromino from "../../../../shared/tetris/moveable-tetromino";
import { LogType, TextLogger } from "../../state-machine-logger";
import { TETROMINO_CHAR } from "../../../../shared/tetris/tetrominos";
import { RegularSpawnEvent } from "./regular-spawn-event";
import { LineClearSpawnEvent } from "./line-clear-spawn-event";
import { TopoutEvent } from "./topout-event";
import { ConfusionEvent } from "./confusion-event";
import { RestartGameEvent } from "../restart-game-event";
import { getColorTypeForTetromino } from "../../../../shared/tetris/tetromino-colors";

enum ActivePieceFailure {
    NOT_PLUS_FOUR_MINOS = "NOT_PLUS_FOUR_MINOS",
    CANNOT_ISOLATE_PIECE = "CANNOT_ISOLATE_PIECE",
    NO_PIECE_FOUND = "NO_PIECE_FOUND",
    PIECE_INCORRECT_TYPE = "PIECE_INCORRECT_TYPE",
}

export class PieceDroppingState extends OCRState {

    public override readonly id = OCRStateID.PIECE_DROPPING;
    // The last known good position of the active piece, calculated by doing a perfect subtraction of stable board
    // from the current board
    private activePiece: MoveableTetromino | undefined = undefined;
    private activePieceThisFrame: MoveableTetromino | null = null;

    // Level remains the same throughout the piece dropping
    private readonly currentLevel = this.globalState.game!.getStatus().level;
        
    public override init() {

        this.registerEvent(new RestartGameEvent(this.config, this.globalState, this.textLogger));
        this.registerEvent(new RegularSpawnEvent(this, this.globalState));
        this.registerEvent(new LineClearSpawnEvent(this, this.globalState));
        this.registerEvent(new TopoutEvent(this));
        this.registerEvent(new ConfusionEvent(this));
    }

    /**
     * Runs the logic for the BeforeGameState each frame.
     * @param gameData 
     * @param ocrFrame 
     */
    protected override async onAdvanceFrame(ocrFrame: OCRFrame) {
        if (this.globalState.game === undefined) throw new Error("Game must be defined in PieceDroppingState");

        // We attempt to compute the active piece for this frame
        const maybeActivePiece = this.computeActivePiece(ocrFrame);
        this.activePieceThisFrame = (maybeActivePiece instanceof MoveableTetromino) ? maybeActivePiece : null;

        // If active piece was already found but is different from this frame, then it is a false positive
        if (
            this.activePieceThisFrame &&
            this.activePiece &&
            this.activePieceThisFrame.tetrominoType !==this.activePiece.tetrominoType
        ) this.activePieceThisFrame = null;

        if (this.activePieceThisFrame) {
            // We only update the active piece if it was found this frame
            this.activePiece = this.activePieceThisFrame;

            // We use the found active piece this frame to send an abbreviated-length packet for just the active piece
            this.globalState.game!.setAbbreviatedBoard(this.activePieceThisFrame);

        } else {
            // We didn't find the active piece this frame, so we are forced to send the entire board state
            const colorBoard = ocrFrame.getColorBoard(this.currentLevel)!;

            // Try to correct colors if it was a perfect subtraction
            if (maybeActivePiece !== ActivePieceFailure.CANNOT_ISOLATE_PIECE) {
                const isolatedBoard = this.globalState.game!.getStableBoard();
                for (let mino of colorBoard.iterateMinos()) {
                    if (mino.color !== ColorType.EMPTY) {
                        const isolatedColor = isolatedBoard.getAt(mino.x, mino.y);
                        
                        let adjustedColor: ColorType;
                        if (isolatedColor !== ColorType.EMPTY) {
                            // Use the color from the isolated board if it exists
                            adjustedColor = isolatedColor;
                        }
                        else {
                            // Otherwise, it is probably the current piece. Use current piece color
                            const currentType = this.globalState.game!.getCurrentType();;
                            adjustedColor = getColorTypeForTetromino(currentType);
                        }
                        colorBoard.setAt(mino.x, mino.y, adjustedColor);
                    }
                }
            }
            // Update entire board
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
    private computeActivePiece(ocrFrame: OCRFrame): MoveableTetromino | ActivePieceFailure {
        

        // Do a perfect subtraction, subtracting the stable board from the current board to get the active piece
        const diffBoard = TetrisBoard.subtract(ocrFrame.getBinaryBoard()!, this.globalState.game!.getStableBoard(), true);
        if (diffBoard === null) {
            this.textLogger.log(LogType.VERBOSE, "Active piece not updated: Failed to subtract stable board from current board");
            return ActivePieceFailure.CANNOT_ISOLATE_PIECE;
        }

        // If the current board's count is not exactly 4 minos more than the stable board, then we cannot determine
        // the active piece
        const stableCount = this.globalState.game!.getStableBoardCount();
        const currentCount = ocrFrame.getBinaryBoard()!.count();
        if (currentCount !== stableCount + 4) {
            this.textLogger.log(LogType.VERBOSE, "Active piece not updated: Current board count is not 4 more than stable board count");
            return ActivePieceFailure.NOT_PLUS_FOUR_MINOS;
        }

        // Extract the active piece from the diff board, if it exists
        const mt = MoveableTetromino.extractFromTetrisBoard(diffBoard);
        if (mt === null) {
            this.textLogger.log(LogType.VERBOSE, "Active piece not updated: Failed to extract MoveableTetromino from diff board");
            return ActivePieceFailure.NO_PIECE_FOUND;
        }

        // Check that the extracted piece is of the correct type
        if (mt.tetrominoType !== this.globalState.game!.getCurrentType()) {
            this.textLogger.log(LogType.VERBOSE, "Active piece not updated: Extracted piece is not of the correct type");
            return ActivePieceFailure.PIECE_INCORRECT_TYPE;
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

