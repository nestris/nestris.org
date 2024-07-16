import { TetrisBoard, ColorType } from "../../tetris/tetris-board";

// given a string of 200 0s and 1s (and 2s and 3s if color), return a TetrisBoard
export class BinaryTranscoder {

  // return a 200-char string of 0-3
  static encode(board: TetrisBoard): string {
    let binaryString = '';

    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            binaryString += board.getAt(x,y);
        }
    }

    return binaryString;
}

  static decode(binaryString: string): TetrisBoard {

    const grid = new TetrisBoard();
  
    let index = 0;
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            const colorType = parseInt(binaryString[index++]) as ColorType;
            grid.setAt(x, y, colorType);
        }
    }
  
    return grid;
  }
  
}
