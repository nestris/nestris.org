import { BufferTranscoder } from "../../shared/network/tetris-board-transcoding/buffer-transcoder";
import { TetrisBoard } from "../../shared/tetris/tetris-board";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { Base62Encoder } from "../scripts/base62-encoder";


// Given a board, current piece, and next piece, encode the puzzle as a string that is deterministic and reversible
export function encodePuzzle(board: TetrisBoard, current: TetrominoType, next: TetrominoType): string {

    const encodedBoard = BufferTranscoder.encode(board);
    console.log(encodedBoard, encodedBoard.length);

    // create a uint8 array that contains the current piece, next piece, and the board
    const puzzleData = new Uint8Array(2 + encodedBoard.length);
    puzzleData[0] = current;
    puzzleData[1] = next;
    puzzleData.set(encodedBoard, 2);

    const encodedPuzzle = Base62Encoder.encode(puzzleData);

    return encodedPuzzle;
}

export function decodePuzzle(encodedPuzzle: string): { board: TetrisBoard, current: TetrominoType, next: TetrominoType } {
    
        const puzzleData = Base62Encoder.decode(encodedPuzzle);
        const current = puzzleData[0];
        const next = puzzleData[1];
        const board = BufferTranscoder.decode(puzzleData.subarray(2));
    
        return { board, current, next };
    }