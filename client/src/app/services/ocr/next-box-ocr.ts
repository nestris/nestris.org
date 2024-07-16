import BinaryGrid, { BlockType } from "src/app/models/binary-grid";
import { RGBGrid } from "src/app/models/ocr/rgb-grid";
import { rgbToHsv } from "src/app/scripts/color";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";


export class NextBoxOCR {

    private binaryGrid: BinaryGrid;
    private readonly VALUE_THRESHOLD = 5;

    constructor(
        private rgbGrid: RGBGrid
    ) {

        this.binaryGrid = new BinaryGrid([], rgbGrid.width, rgbGrid.height);

        for (let y = 0; y < rgbGrid.height; y++) {
            for (let x = 0; x < rgbGrid.width; x++) {

                const rgb = rgbGrid.getAt(x, y);
                const hsv = rgbToHsv(rgb);

                this.binaryGrid.setAt(x, y, hsv.v > this.VALUE_THRESHOLD ? BlockType.FILLED : BlockType.EMPTY);
            }
        }
    }

    existsAt(x: number, y: number): boolean {
        return this.binaryGrid.exists(x,y);
    }

    getMostSimilarPieceType(): TetrominoType | undefined {
        return TetronimoOCR.findMostSimilarPieceType(this.binaryGrid);
    }

}

export class TetronimoOCR {
    constructor(public readonly type: TetrominoType, public readonly grid: BinaryGrid) {
        if (grid.height !== 6 || grid.width !== 8) {
            throw new Error('TetronimoOCR grid must be 6x8');
        }
    }

    public static readonly I_OCR: TetronimoOCR = new TetronimoOCR(TetrominoType.I_TYPE, new BinaryGrid([
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1 ,1, 1, 1, 1, 1],
        [1, 1, 1 ,1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ]));

    public static readonly T_OCR: TetronimoOCR = new TetronimoOCR(TetrominoType.T_TYPE, new BinaryGrid([
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1 ,1, 1, 1, 1, 1, 0],
        [0, 1 ,1, 1, 1, 1, 1, 0],
        [0, 0 ,0, 1, 1, 0, 0, 0],
        [0, 0 ,0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ]));

    public static readonly L_OCR: TetronimoOCR = new TetronimoOCR(TetrominoType.L_TYPE, new BinaryGrid([
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1 ,1, 1, 1, 1, 1, 0],
        [0, 1 ,1, 1, 1, 1, 1, 0],
        [0, 1 ,1, 0, 0, 0, 0, 0],
        [0, 1 ,1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ]));

    public static readonly J_OCR: TetronimoOCR = new TetronimoOCR(TetrominoType.J_TYPE, new BinaryGrid([
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1 ,1, 1, 1, 1, 1, 0],
        [0, 1 ,1, 1, 1, 1, 1, 0],
        [0, 0 ,0, 0, 0, 1, 1, 0],
        [0, 0 ,0, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ]));

    public static readonly O_OCR: TetronimoOCR = new TetronimoOCR(TetrominoType.O_TYPE, new BinaryGrid([
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0 ,1, 1, 1, 1, 0, 0],
        [0, 0 ,1, 1, 1, 1, 0, 0],
        [0, 0 ,1, 1, 1, 1, 0, 0],
        [0, 0 ,1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ]));

    public static readonly S_OCR: TetronimoOCR = new TetronimoOCR(TetrominoType.S_TYPE, new BinaryGrid([
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0 ,0, 1, 1, 1, 1, 0],
        [0, 0 ,0, 1, 1, 1, 1, 0],
        [0, 1 ,1, 1, 1, 0, 0, 0],
        [0, 1 ,1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ]));

    public static readonly Z_OCR: TetronimoOCR = new TetronimoOCR(TetrominoType.Z_TYPE, new BinaryGrid([
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1 ,1, 1, 1, 0, 0, 0],
        [0, 1 ,1, 1, 1, 0, 0, 0],
        [0, 0 ,0, 1, 1, 1, 1, 0],
        [0, 0 ,0, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ]));

    public static readonly ALL_OCR: TetronimoOCR[] = [
        TetronimoOCR.I_OCR,
        TetronimoOCR.T_OCR,
        TetronimoOCR.J_OCR,
        TetronimoOCR.L_OCR,
        TetronimoOCR.O_OCR,
        TetronimoOCR.S_OCR,
        TetronimoOCR.Z_OCR
    ];

    public static getOCRByType(type: TetrominoType): TetronimoOCR {
        return TetronimoOCR.ALL_OCR.find(piece => piece.type === type)!;
    }

    // return number of blocks that are different. the lower, the more similar
    public similarityTo(otherGrid: BinaryGrid): number {
        let diff = 0;
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                if (this.grid.exists(x, y) !== otherGrid.exists(x, y)) {
                    diff++;
                }
            }
        }
        return diff;
    }

    // classify next box piece type based on OCR grid. If no piece is sufficiently similar, return undefined
    public static findMostSimilarPieceType(grid: BinaryGrid): TetrominoType | undefined {

        const MAXIMUM_DIFFERENCE_ALLOWED = 2;

        let lowestDiff: number | undefined = undefined;
        let lowestDiffType;
        for (const tetromino of TetronimoOCR.ALL_OCR) {
            const diff = tetromino.similarityTo(grid);
            if (lowestDiff === undefined || diff < lowestDiff) {
                lowestDiff = diff;
                lowestDiffType = tetromino.type;
            }
        }

        if (lowestDiff === undefined || lowestDiff > MAXIMUM_DIFFERENCE_ALLOWED) {
            return undefined;
        } else {
            return lowestDiffType;
        }



    }

}