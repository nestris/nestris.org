import { BoardOCRBox } from "../calibration/board-ocr-box";
import { Calibration } from "../util/calibration";
import { Frame } from "../util/frame";
import { ColorType, TetrisBoard } from "../../shared/tetris/tetris-board";
import { colorDistance } from "../../shared/tetris/tetromino-colors";
import { NextOCRBox } from "../calibration/next-ocr-box";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { findSimilarTetrominoType } from "../calibration/next-ocr-similarity";
import MoveableTetromino from "../../shared/tetris/moveable-tetromino";
import { NumberOCRBox } from "../calibration/number-ocr-box";
import { DigitClassifier, Prediction } from "../digit-classifier/digit-classifier";

/**
 * An OCRFrame stores a single RGB frame of a video, and provides methods to extract information from the frame
 * through lazy-loaded properties, such that extractable features are only computed when requested.
 */
export class OCRFrame {

    readonly boardOCRBox: BoardOCRBox;
    readonly nextOCRBox: NextOCRBox;
    readonly levelOCRBox: NumberOCRBox;
    readonly scoreOCRBox: NumberOCRBox;

    private _boardUncolored: TetrisBoard | undefined;
    private _boardNoise: number | undefined;
    private _nextType: TetrominoType | undefined;
    private _level: number | undefined;
    private _score: number | undefined;
    private _boardOnlyTetrominoType: TetrominoType | undefined;

    /**
     * @param frame The singular frame to extract OCR information from
     * @param calibration The calibration data for the frame to use for OCR
     */
    constructor(
        public readonly frame: Frame,
        public readonly calibration: Calibration,
        public readonly digitClassifier?: DigitClassifier,
    ) {
        this.boardOCRBox = new BoardOCRBox(calibration.rects.board);
        this.nextOCRBox = new NextOCRBox(calibration.rects.next);
        this.levelOCRBox = new NumberOCRBox(2, calibration.rects.level, digitClassifier);
        this.scoreOCRBox = new NumberOCRBox(6, calibration.rects.score, digitClassifier);
    }

    /**
     * Gets the extracted tetris board without color assignment from this frame with lazy loading. Uses
     * block shine to determine if block exists, then uses the mino points to determine the color of the block.
     * 
     * @param loadIfNotLoaded If true, the property will be computed if it has not been loaded yet
     * @returns The extracted tetris board
     */
    getBinaryBoard(loadIfNotLoaded: boolean = true): TetrisBoard | undefined {
        if (loadIfNotLoaded && this._boardUncolored === undefined) {

            // Iterate through each mino on the board and determine the block's color if it exists
            this._boardUncolored = new TetrisBoard();
            for (let point of this._boardUncolored.iterateMinos()) {

                // We use the block shine to determine if a block exists at this point
                const blockShinePosition = this.boardOCRBox.getBlockShine(point);
                const blockShineColor = this.frame.getPixelAt(blockShinePosition);
                if (!blockShineColor) throw new Error(`Block shine color not found at ${blockShinePosition.x}, ${blockShinePosition.y}`);

                if (blockShineColor.average > 30) {
                    // If block shine detected, we use the mino points to determine the color of the block
                    // TODO: Implement color detection
                    this._boardUncolored.setAt(point.x, point.y, ColorType.PRIMARY);
                } else {
                    // If block shine not detected, no mino exists at this point
                    this._boardUncolored.setAt(point.x, point.y, ColorType.EMPTY);
                }
            }
        }
        return this._boardUncolored;
    }

    /**
     * Gets the average color-difference score across each set of mino points for each mino on the board.
     * The lower the score, the more consistent the board is in terms of color, and the more likely the
     * it is a Tetris board that being displayed on the frame.
     * @param loadIfNotLoaded 
     */
    getBoardNoise(loadIfNotLoaded: boolean = true): number | undefined {
        if (loadIfNotLoaded && this._boardNoise === undefined) {

            // Iterate through each mino on the board get the color distance between two points on the mino
            let totalDifference = 0;
            for (let point of (new TetrisBoard()).iterateMinos()) {
                const [point1, point2] = this.boardOCRBox.getMinoPoints(point);
                const color1 = this.frame.getPixelAt(point1);
                const color2 = this.frame.getPixelAt(point2);
                if (!color1 || !color2) throw new Error(`Color not found at ${point1.x}, ${point1.y} or ${point2.x}, ${point2.y}`);
                totalDifference += colorDistance(color1, color2);
            }

            // Average the total difference across all minos
            this._boardNoise = totalDifference / 200;
        }
        return this._boardNoise;
    }

    /**
     * Gets the binary grid of the next box from this frame by checking if each pixel
     * is above a certain brightness threshold.
     * @returns The binary grid of the next box, where 1 is bright and 0 is dark
     */
    getNextGrid(): number[][] {

        // A pixel is considered "bright" if its average color is above this threshold
        const BRIGHTNESS_THRESHOLD = 30;

        return this.nextOCRBox.getGridPoints().map(row => {
            return row.map(point => {
                const pixel = this.frame.getPixelAt(point);
                if (!pixel) throw new Error(`Pixel not found at ${point.x}, ${point.y}`);

                return pixel.average > BRIGHTNESS_THRESHOLD ? 1 : 0;
            })
        });
    }

    /**
     * Gets the type of the next tetromino from getNextGrid() by finding similarities between
     * the grid and the known OCR tetrominos.
     * @param loadIfNotLoaded If true, the property will be computed if it has not been loaded yet
     * @returns The type of the next tetromino
     */
    getNextType(loadIfNotLoaded: boolean = true): TetrominoType | undefined {
        if (loadIfNotLoaded && this._nextType === undefined) {
            const nextGrid = this.getNextGrid();
            this._nextType = findSimilarTetrominoType(nextGrid);
        }
        return this._nextType;
    }

    /**
     * Predicts the digits of for a given NumberOCRBox from the frame. If minimum confidence is not met,
     * returns -1.
     * @param ocrBox 
     */
    private async predictDigits(ocrBox: NumberOCRBox): Promise<number> {
    
        // Each digit must have a minimum confidence of this value for the OCR to be successful
        const MINIMUM_CONFIDENCE = 0.7;

        // Predict each digit from the frame
        const digits = await Promise.all(
            Array.from({length: ocrBox.numDigits}, (_, i) => ocrBox.predictDigit(i, this.frame))
        );

        console.log("digits", digits);
    
        // If any digit is not found or has low confidence, we fail OCR
        if (digits.some(digit => digit === undefined)) return -1;
        if (digits.some(digit => digit!.probability < MINIMUM_CONFIDENCE)) return -1;
    
        // If all digits are found and have high confidence, we return the number
        return digits.reduce((acc, digit) => acc * 10 + digit!.digit, 0);
    }

    /**
     * Gets the level of the game from the frame by OCRing the level number from the frame. If
     * there is not sufficient confidence in the OCR, returns null.
     * @param loadIfNotLoaded If true, the property will be computed if it has not been loaded yet
     * @returns The level of the game. If the level could not be OCR'd, returns -1. If the level
     * has not been loaded yet, returns undefined.
     */
    async getLevel(loadIfNotLoaded: boolean = true): Promise<number | undefined> {
        if (loadIfNotLoaded && this._level === undefined) {
            // Predict the digits of the level from the frame, or return -1 if OCR fails
            console.log("OCRFrame.getLevel");
            this._level = await this.predictDigits(this.levelOCRBox);
            console.log("OCRFrame.getLevel result", this._level);
        }
        return this._level;
    }

    /**
     * Gets the score of the game from the frame by OCRing the score number from the frame. If
     * there is not sufficient confidence in the OCR, returns null.
     * @param loadIfNotLoaded If true, the property will be computed if it has not been loaded yet
     * @returns The score of the game. If the score could not be OCR'd, returns -1. If the score
     * has not been loaded yet, returns undefined.
     */
    async getScore(loadIfNotLoaded: boolean = true): Promise<number | undefined> {
        if (loadIfNotLoaded && this._score === undefined) {
            // Predict the digits of the score from the frame, or return -1 if OCR fails
            console.log("OCRFrame.getScore");
            this._score = await this.predictDigits(this.scoreOCRBox);
            console.log("OCRFrame.getScore result", this._score);
        }
        return this._score;
    }

    /**
     * If the board currently contains only one valid tetromino and no other minos, returns the
     * type of that tetromino. Otherwise, returns TETROMINO_TYPE.ERROR_TYPE.
     * @param loadIfNotLoaded If true, the property will be computed if it has not been loaded yet
     * @returns The type of the tetromino on the board, or TETROMINO_TYPE.ERROR_TYPE if not found
     */
    getBoardOnlyTetrominoType(loadIfNotLoaded: boolean = true): TetrominoType | undefined {
        if (loadIfNotLoaded && this._boardOnlyTetrominoType === undefined) {
            this._boardOnlyTetrominoType = MoveableTetromino.extractFromTetrisBoard(
                this.getBinaryBoard()!
            )?.tetrominoType ?? TetrominoType.ERROR_TYPE;
        }
        return this._boardOnlyTetrominoType;
    }

}