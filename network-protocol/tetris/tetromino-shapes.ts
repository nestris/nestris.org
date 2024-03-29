import { TetrominoType } from "./tetromino-type";

const PIECE_I = [
    [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
    ],

    [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
    ],
];

const PIECE_J = [
    [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 1],
    ],

    [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 1, 1, 0],
    ],

    [
        [0, 1, 0, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 0],
    ],

    [
        [0, 0, 1, 1],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
    ],
];

const PIECE_L = [
    [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 0, 0],
    ],

    [
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
    ],

    [
        [0, 0, 0, 1],
        [0, 1, 1, 1],
        [0, 0, 0, 0],
    ],

    [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 1],
    ],
];

const PIECE_O = [
    [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
    ],
];

const PIECE_S = [
    [
        [0, 0, 0, 0],
        [0, 0, 1, 1],
        [0, 1, 1, 0],
    ],

    [
        [0, 0, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 0, 1],
    ],
];

const PIECE_T = [
    [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 0, 1, 0],
    ],

    [
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
    ],

    [
        [0, 0, 1, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 0],
    ],

    [
        [0, 0, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 0],
    ],
];

const PIECE_Z = [
    [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 1],
    ],

    [
        [0, 0, 0, 1],
        [0, 0, 1, 1],
        [0, 0, 1, 0],
    ],
];

const PIECE_ERROR = [[[]]];

export const PIECE_SHAPE: {[key in TetrominoType] : number[][][]} = {
    [TetrominoType.I_TYPE] : PIECE_I,
    [TetrominoType.O_TYPE] : PIECE_O,
    [TetrominoType.L_TYPE] : PIECE_L,
    [TetrominoType.J_TYPE] : PIECE_J,
    [TetrominoType.T_TYPE] : PIECE_T,
    [TetrominoType.S_TYPE] : PIECE_S,
    [TetrominoType.Z_TYPE] : PIECE_Z,
    [TetrominoType.ERROR_TYPE] : PIECE_ERROR,
}