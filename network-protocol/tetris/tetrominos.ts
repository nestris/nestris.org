import { BlockPosition, BlockSet } from "./block-set";
import { getColorForTetrominoAndLevel } from "./tetromino-colors";
import { PIECE_SHAPE } from "./tetromino-shapes";
import { ALL_TETROMINO_TYPES, TetrominoType } from "./tetromino-type";


export const TETROMINO_CHAR: {[key in TetrominoType]: string} = {
    [TetrominoType.I_TYPE] : "I",
    [TetrominoType.O_TYPE] : "O",
    [TetrominoType.L_TYPE] : "L",
    [TetrominoType.J_TYPE] : "J",
    [TetrominoType.T_TYPE] : "T",
    [TetrominoType.S_TYPE] : "S",
    [TetrominoType.Z_TYPE] : "Z",
    [TetrominoType.ERROR_TYPE] : "E",
}

export const TETROMINO_CHAR_TO_TYPE: {[key: string]: TetrominoType} = {
    "I": TetrominoType.I_TYPE,
    "O": TetrominoType.O_TYPE,
    "L": TetrominoType.L_TYPE,
    "J": TetrominoType.J_TYPE,
    "T": TetrominoType.T_TYPE,
    "S": TetrominoType.S_TYPE,
    "Z": TetrominoType.Z_TYPE,
    "E": TetrominoType.ERROR_TYPE,
}


// the four block sets for each rotation of the tetromino.
// 0 = no rotation, 1 = 90 degrees clockwise, 2 = 180 degrees clockwise, 3 = 270 degrees clockwise
// always positioned as leftmost and topmost as possible
export class Tetromino {

  
    // precompute blocksets for all seven tetrominos at the start of the program
    public static readonly ALL_PIECES: Tetromino[] = ALL_TETROMINO_TYPES.map(
        (type) => new Tetromino(type)
    )

    public readonly blockSet: BlockSet[];

    constructor(public readonly type: TetrominoType) {
        const blocksets: BlockSet[] = [];
        const shape = PIECE_SHAPE[type];

        // create a BlockSet for each rotation
        for (let shapeForRot of shape) {

            const blockPositions: BlockPosition[] = [];

            for (let y = 0; y < shapeForRot.length; y++) { // iterate over rows
                let row = shapeForRot[y];

                for (let x = 0; x < row.length; x++) { // iterate over columns

                    // if there is a block at (x,y), push that coordinate to BlockSet
                    if (row[x] === 1) { // there is a block at (x,y)
                        blockPositions.push(new BlockPosition(x, y));
                    }
                }
            }
            // push this rotation's blockset to the list of blocksets
            blocksets.push(new BlockSet(blockPositions));
        }

        this.blockSet = blocksets;
    }

    public static getPieceByType(type: TetrominoType): Tetromino {
        return Tetromino.ALL_PIECES.find(piece => piece.type === type)!;
    }
    
    public getBlockSet(rotation: number): BlockSet {
        return this.blockSet[rotation % this.blockSet.length];
    }

    public getColorForLevel(level: number): string {
        return getColorForTetrominoAndLevel(this.type, level);
    }

    public numPossibleRotations(): number {
        return this.blockSet.length;
    }

}