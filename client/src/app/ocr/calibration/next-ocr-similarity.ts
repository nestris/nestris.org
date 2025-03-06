import { TetrominoType } from "../../shared/tetris/tetromino-type";

const similarityGrids: { [key in TetrominoType]?: number[][] } = {
    [TetrominoType.I_TYPE] : [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1 ,1, 1, 1, 1, 1],
        [1, 1, 1 ,1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    [TetrominoType.T_TYPE] : [
        [0, 1 ,1, 1, 1, 1, 1, 0],
        [0, 1 ,1, 1, 1, 1, 1, 0],
        [0, 0 ,0, 1, 1, 0, 0, 0],
        [0, 0 ,0, 1, 1, 0, 0, 0],
    ],
    [TetrominoType.L_TYPE] : [
        [0, 1 ,1, 1, 1, 1, 1, 0],
        [0, 1 ,1, 1, 1, 1, 1, 0],
        [0, 1 ,1, 0, 0, 0, 0, 0],
        [0, 1 ,1, 0, 0, 0, 0, 0],
    ],
    [TetrominoType.J_TYPE] : [
        [0, 1 ,1, 1, 1, 1, 1, 0],
        [0, 1 ,1, 1, 1, 1, 1, 0],
        [0, 0 ,0, 0, 0, 1, 1, 0],
        [0, 0 ,0, 0, 0, 1, 1, 0],
    ],
    [TetrominoType.O_TYPE] : [
        [0, 0 ,1, 1, 1, 1, 0, 0],
        [0, 0 ,1, 1, 1, 1, 0, 0],
        [0, 0 ,1, 1, 1, 1, 0, 0],
        [0, 0 ,1, 1, 1, 1, 0, 0],
    ],
    [TetrominoType.S_TYPE] : [
        [0, 0 ,0, 1, 1, 1, 1, 0],
        [0, 0 ,0, 1, 1, 1, 1, 0],
        [0, 1 ,1, 1, 1, 0, 0, 0],
        [0, 1 ,1, 1, 1, 0, 0, 0],
    ],
    [TetrominoType.Z_TYPE] : [
        [0, 1 ,1, 1, 1, 0, 0, 0],
        [0, 1 ,1, 1, 1, 0, 0, 0],
        [0, 0 ,0, 1, 1, 1, 1, 0],
        [0, 0 ,0, 1, 1, 1, 1, 0],
    ],
}


/**
 * Returns the number of differences between two grids
 */
function numDifferences(grid1: number[][], grid2: number[][]): number {
    let diff = 0;
    for (let y = 0; y < grid1.length; y++) {
        for (let x = 0; x < grid1[y].length; x++) {
            if (grid1[y][x] !== grid2[y][x]) {
                diff++;
            }
        }
    }
    return diff;
}

/**
 * Returns the type of the tetromino that is most similar to the given grid. Only allow
 * a maximum of MAXIMUM_DIFFERENCE_ALLOWED differences, otherwise return undefined.
 * @param nextGrid The grid to find the most similar tetromino type to
 * @returns The type of the most similar tetromino, or undefined if no tetromino is similar enough
 */
export function findSimilarTetrominoType(nextGrid: number[][]): TetrominoType | undefined {

    const MAXIMUM_DIFFERENCE_ALLOWED = 1;

    let lowestDiff: number | undefined = undefined;
    let lowestDiffType: TetrominoType = TetrominoType.ERROR_TYPE;
    for (const [type, grid] of Object.entries(similarityGrids)) {
        const diff = numDifferences(grid, nextGrid);
        if (diff <= MAXIMUM_DIFFERENCE_ALLOWED && (lowestDiff === undefined || diff < lowestDiff)) {
            lowestDiff = diff;
            lowestDiffType = parseInt(type);
        }
    }
    return lowestDiffType;
}
