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

export function getRandomTetrominoType(): TetrominoType {
    return ALL_TETROMINO_TYPES[Math.floor(Math.random() * ALL_TETROMINO_TYPES.length)];
}