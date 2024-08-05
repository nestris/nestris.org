import { Point } from "./point";
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

// returns the top left point of a piece
function getTopLeft(piece: number[][]): Point {
    for (let y = 0; y < piece.length; y++) {
        for (let x = 0; x < piece[y].length; x++) {
            if (piece[y][x] === 1) {
                return { x, y };
            }
        }
    }
    throw new Error("Piece is empty");
}

/**
 * At PIECE_TOP_LEFT[tetrominoType][rotation], gets the top left point of the piece
 */
export const PIECE_TOP_LEFT: {[key in TetrominoType] : Point[]} = {
    [TetrominoType.I_TYPE] : PIECE_I.map(getTopLeft),
    [TetrominoType.O_TYPE] : PIECE_O.map(getTopLeft),
    [TetrominoType.L_TYPE] : PIECE_L.map(getTopLeft),
    [TetrominoType.J_TYPE] : PIECE_J.map(getTopLeft),
    [TetrominoType.T_TYPE] : PIECE_T.map(getTopLeft),
    [TetrominoType.S_TYPE] : PIECE_S.map(getTopLeft),
    [TetrominoType.Z_TYPE] : PIECE_Z.map(getTopLeft),
    [TetrominoType.ERROR_TYPE] : PIECE_ERROR.map(getTopLeft),
}