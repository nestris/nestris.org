import { ColorType, TetrisBoard } from "../tetris-board";

// encodes and decodes tetris board retaining full color information compactly into a buffer

export class BufferTranscoder {

  // return a string of 400 bits
  static encode(board: TetrisBoard): Buffer {

    const bytes = Buffer.alloc(50); // 50 bytes to store 200 cells
    let byteIndex = 0;
    let bitIndex = 0;
    let value = 0;

    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            const color = board.getAt(x, y);
            value |= (color << (6 - bitIndex)); // Shift color into position

            bitIndex += 2;
            if (bitIndex === 8) { // If we've filled up this byte
                bytes[byteIndex++] = value;
                bitIndex = 0;
                value = 0; // Reset for next byte
            }
        }
    }

    return bytes;
}

  static decode(encoded: Buffer): TetrisBoard {

    const board = new TetrisBoard();
    let byteIndex = 0;
    let bitIndex = 0;

    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            if (bitIndex === 8) {
                byteIndex++;
                bitIndex = 0;
            }

            const byte = encoded[byteIndex];
            const color = (byte >> (6 - bitIndex)) & 0b11; // Extract 2 bits
            board.setAt(x, y, color);
            bitIndex += 2;
        }
    }

    return board;
  }
  
}
