import { TetrisBoard } from '../tetris/tetris-board';
import { TetrominoType } from '../tetris/tetromino-type';
import { BufferTranscoder } from '../network/tetris-board-transcoding/buffer-transcoder';

// Given a board, current piece, and next piece, encode the puzzle as a string that is deterministic and reversible
export function encodePuzzle(board: TetrisBoard, current: TetrominoType, next: TetrominoType): string {

    const encodedBoard = BufferTranscoder.encode(board);
    console.log(encodedBoard, encodedBoard.length);

    // create a uint8 array that contains the current piece, next piece, and the board
    const puzzleData = new Uint8Array(2 + encodedBoard.length);
    puzzleData[0] = current;
    puzzleData[1] = next;
    puzzleData.set(encodedBoard, 2);

    const encodedPuzzle = encodeURIComponent(Buffer.from(puzzleData).toString('base64'));
    console.log(encodedPuzzle);

    return encodedPuzzle;
}

export function decodePuzzle(encodedPuzzle: string): { board: TetrisBoard, current: TetrominoType, next: TetrominoType } {
    
        const puzzleData = Buffer.from(decodeURIComponent(encodedPuzzle), 'base64');
        const current = puzzleData[0];
        const next = puzzleData[1];
        const board = BufferTranscoder.decode(puzzleData.subarray(2));
    
        return { board, current, next };
    }