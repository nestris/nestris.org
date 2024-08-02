import { BoardOCRBox } from "../calibration/board-ocr-box";
import { Calibration } from "../models/calibration";
import { Frame } from "../models/frame";
import { ColorType, TetrisBoard } from "../../shared/tetris/tetris-board";

/**
 * An OCRFrame stores a single RGB frame of a video, and provides methods to extract information from the frame
 * through lazy-loaded properties, such that extractable features are only computed when requested.
 */
export class OCRFrame {

    readonly boardOCRBox: BoardOCRBox;

    private _board: TetrisBoard | undefined;

    /**
     * @param level The level of the game at this frame, which is used for color matching for the mino colors
     * @param frame The singular frame to extract OCR information from
     * @param calibration The calibration data for the frame to use for OCR
     */
    constructor(
        private readonly level: number,
        private readonly frame: Frame,
        private readonly calibration: Calibration
    ) {
        this.boardOCRBox = new BoardOCRBox(calibration.rects.board);
    }

    /**
     * Gets the extracted tetris board from this frame with lazy loading. Uses block shine to determine if block
     * exists, then uses the mino points to determine the color of the block.
     * 
     * @returns The extracted tetris board
     */
    get board(): TetrisBoard {
        if (!this._board) {

            // Iterate through each mino on the board and determine the block's color if it exists
            this._board = new TetrisBoard();
            for (let point of this._board.iterateMinos()) {

                // We use the block shine to determine if a block exists at this point
                const blockShinePosition = this.boardOCRBox.getBlockShine(point);
                const blockShineColor = this.frame.getPixelAt(blockShinePosition);
                if (!blockShineColor) throw new Error(`Block shine color not found at ${blockShinePosition.x}, ${blockShinePosition.y}`);

                if (blockShineColor.average > 130) {
                    // If block shine detected, we use the mino points to determine the color of the block
                    // TODO: Implement color detection
                    this._board.setAt(point.x, point.y, ColorType.WHITE);
                } else {
                    // If block shine not detected, no mino exists at this point
                    this._board.setAt(point.x, point.y, ColorType.EMPTY);
                }
            }
        }
        return this._board;
    }

}