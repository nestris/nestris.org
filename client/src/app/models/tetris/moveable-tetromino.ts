import { BlockSet } from "./block-set";
import { ColorType, TetrisBoard } from "./tetris-board";
import { getColorTypeForTetromino } from "./tetromino-colors";
import { TetrominoType } from "./tetromino-type";
import { Tetromino } from "./tetrominos";

/*
A tetromino set to some absolute position and rotation on the board. Mutable, so can be translated around.
Exposes utility methods for checking if the tetromino is in bounds, and if it is colliding with
other blocks.
*/

export default class MoveableTetromino {

    private currentBlockSet!: BlockSet;

    public readonly color: ColorType;

    // Returns the starting pose of a piece at spawn
    static fromSpawnPose(tetrominoType: TetrominoType): MoveableTetromino {

        // special case: I piece needs to be one higher
        const y = (tetrominoType === TetrominoType.I_TYPE) ? 0 : -1;

        return new MoveableTetromino(tetrominoType, 0, 3, y);
    }

    constructor(public readonly tetrominoType: TetrominoType, private rotation: number, private translateX: number, private translateY: number) {
        this.color = getColorTypeForTetromino(tetrominoType);
        this.updateCurrentBlockSet()
    }

    // encoding format: TRXXYY
    public encodeAsNumber(): number {

        const typeAsNumber: number = this.tetrominoType as number;
        return typeAsNumber * 100000 + this.rotation * 10000 + this.translateX * 100 + this.translateY;
    }

    static decodeFromNumber(number: number): MoveableTetromino {

        const typeAsNumber = Math.floor(number / 100000);
        let type: TetrominoType;
        switch (typeAsNumber) {
            case 0: type = TetrominoType.I_TYPE; break;
            case 1: type = TetrominoType.J_TYPE; break;
            case 2: type = TetrominoType.L_TYPE; break;
            case 3: type = TetrominoType.O_TYPE; break;
            case 4: type = TetrominoType.S_TYPE; break;
            case 5: type = TetrominoType.T_TYPE; break;
            case 6: type = TetrominoType.Z_TYPE; break;
            default: throw new Error("invalid typeAsNumber");
        }

        const rotation = Math.floor((number % 100000) / 10000);
        const translateX = Math.floor((number % 10000) / 100);
        const translateY = Math.floor(number % 100);

        return new MoveableTetromino(type, rotation, translateX, translateY);
    }

    static doesBlocksetMatchMask(pieceMask: TetrisBoard, maskStartX: number, maskStartY: number, blockSet: BlockSet): boolean {
        let exists = true;
        blockSet.blocks.forEach(block => {
            if (!pieceMask.exists(block.x + maskStartX, block.y + maskStartY)) {
                exists = false;
            }
        });
        return exists;
    }

    static getMTForPieceMask(pieceMask: TetrisBoard, maskStartX: number, maskStartY: number, pieceType: TetrominoType): MoveableTetromino | undefined {
        const tetronimo = Tetromino.getPieceByType(pieceType);
        console.log("getmtf", pieceType);
        console.log(tetronimo.numPossibleRotations());
        for (let rot = 0; rot < tetronimo.numPossibleRotations(); rot++) {
            const blockSet = tetronimo.getBlockSet(rot);
            if (MoveableTetromino.doesBlocksetMatchMask(pieceMask, maskStartX, maskStartY, blockSet)) {
                return new MoveableTetromino(pieceType, rot, maskStartX, maskStartY);
            }
        }
        return undefined;
    };


    private updateCurrentBlockSet(): void {
        const tetromino = Tetromino.getPieceByType(this.tetrominoType);
        this.currentBlockSet = tetromino.getBlockSet(this.rotation).translate(this.translateX, this.translateY);
    }

    public getCurrentBlockSet(): BlockSet {
        return this.currentBlockSet;
    }

    public getRotation(): number {
        return this.rotation;
    }

    public getTranslateX(): number {
        return this.translateX;
    }

    public getTranslateY(): number {
        return this.translateY;
    }

    public getLowestY(): number {
        return this.getCurrentBlockSet().maxY;
    }

    public updatePose(rotation: number | undefined, translateX: number | undefined, translateY: number | undefined): void {
        if (rotation !== undefined) {
            const numPossibleRotations = Tetromino.getPieceByType(this.tetrominoType).numPossibleRotations();
            this.rotation = rotation % numPossibleRotations;
        }
        if (translateX !== undefined) {
            this.translateX = translateX;
        }
        if (translateY !== undefined) {
            this.translateY = translateY;
        }
        this.updateCurrentBlockSet();
    }

    public moveBy(dr: number, dx: number, dy: number): void {
        this.updatePose(this.rotation + dr + 4, this.translateX + dx, this.translateY + dy);
    }

    public rotateBy(delta: number): void {
        const numPossibleRotations = Tetromino.getPieceByType(this.tetrominoType).numPossibleRotations();
        this.rotation = (this.rotation + delta) % numPossibleRotations;
        this.updateCurrentBlockSet();
    }

    // whether the entire MT is within the bounds of the board
    public isInBounds(): boolean {
        return this.getCurrentBlockSet().blocks.every(block => block.inBounds());
    }


    // Whether one of the minos of this tetromino is a the given position
    public isAtLocation(x: number, y: number): boolean {
        return this.getCurrentBlockSet().blocks.some(block => block.x === x && block.y === y);
    }

    // blit each block of the tetromino into the board with the tetromino's color
    public blitToBoard(board: TetrisBoard) {

        const blockSet = this.getCurrentBlockSet();
        blockSet.blocks.forEach(block => {
            board.setAt(block.x, block.y, this.color);
        });
    }

    public intersectsBoard(board: TetrisBoard): boolean {
        return this.getCurrentBlockSet().blocks.some(block => board.exists(block.x, block.y));
    }

    // placement is valid if the piece is in bounds, and does not intersect with the grid, 
    // but moving the piece down one row would intersect with the grid
    public isValidPlacement(board: TetrisBoard): boolean {
        if (!this.isInBounds()) return false;
        if (this.intersectsBoard(board)) return false;
        const movedMT = new MoveableTetromino(this.tetrominoType, this.rotation, this.translateX, this.translateY + 1);
        return !movedMT.isInBounds() || movedMT.intersectsBoard(board);
    }

    // whether the two MTs are the same type and  at the exact same pose
    public equals(other: MoveableTetromino): boolean {
        if (this.tetrominoType !== other.tetrominoType) return false;
        if (this.rotation !== other.rotation) return false;
        if (this.translateX !== other.translateX) return false;
        if (this.translateY !== other.translateY) return false;
        return true;
    }

    // return in tetris notation
    public getTetrisNotation(): string {

        let string = "" + this.tetrominoType + "-";

        // find all the columns that have blocks
        const columns: number[] = [];
        this.getCurrentBlockSet().blocks.forEach(block => {
            if (!columns.includes(block.x)) {
                columns.push(block.x);
            }
        });

        // sort columns in ascending order
        columns.sort((a, b) => a - b);

        // assemble into string
        columns.forEach(column => {
            if (column === 9) string += "0";
            else string += column + 1;
        });

        return string;
    }

    public print() {

        const mask = new TetrisBoard();
        this.blitToBoard(mask);

        console.log(this.getTetrisNotation());
        mask.print();
    }
}
