import { BlockPosition, BlockSet } from "./block-set";
import { getColorForTetrominoAndLevel } from "./tetromino-colors";
import { PIECE_SHAPE } from "./tetromino-shapes";

export enum TetrominoType {
    I_TYPE = 0,
    O_TYPE = 1,
    L_TYPE = 2,
    J_TYPE = 3,
    T_TYPE = 4,
    S_TYPE = 5,
    Z_TYPE = 6,
    ERROR_TYPE = 7
}

// list of all VALID tetromino types
export const ALL_TETROMINO_TYPES = [
    TetrominoType.I_TYPE,
    TetrominoType.O_TYPE,
    TetrominoType.L_TYPE,
    TetrominoType.J_TYPE,
    TetrominoType.T_TYPE,
    TetrominoType.S_TYPE,
    TetrominoType.Z_TYPE,
]


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