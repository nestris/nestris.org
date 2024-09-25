/*
Get successive boards by playing through games with AI moves.
*/

import { InputSpeed } from "../../shared/models/input-speed";
import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { decodeStackrabbitResponse } from "../../shared/scripts/stackrabbit-decoder";
import { TetrisBoard, getRandomColorType } from "../../shared/tetris/tetris-board";
import { TetrominoType, getRandomTetrominoType } from "../../shared/tetris/tetromino-type";
import { BoardGenerator } from "./board-generator";
import { getTopMovesHybrid } from "./stackrabbit";


export enum GeneratorMode {
  NB = "NB", // NB mode tends to generate more dependent boards (easier to solve)
  NNB = "NNB" // NNB mode tends to generate less dependent boards (harder to solve)
}

export class SequentialBoardGenerator extends BoardGenerator {

  board!: TetrisBoard;
  current!: TetrominoType;
  next!: TetrominoType;

  constructor(
    private readonly mode: GeneratorMode = GeneratorMode.NB,
    private readonly inflateSZ: boolean = true,
  ) {
    super();
    this.getResetBoardState();
  }

  getResetBoardState(): { board: TetrisBoard, current: TetrominoType, next: TetrominoType} {
    this.board = new TetrisBoard();
    this.current = getRandomTetrominoType();
    this.next = getRandomTetrominoType();

    // randomize bottom row
    let numMinos = 0;
    for (let i = 0; i < 9; i++) {
      if (Math.random() < 0.5) {
        this.board.setAt(i, 19, getRandomColorType());
        numMinos++;
      }
    }

    // if numMinos is odd, add one more on second row to make it even
    // since only even number of minos are possible at any point
    if (numMinos % 2 === 1) {
      for (let i = 0; i < 9; i++) {
        if (this.board.getAt(i, 19) === 1) {
          this.board.setAt(i, 18, getRandomColorType());
          break;
        }
      }
    }

    return { board: this.board, current: this.current, next: this.next };
  }

  async getNextBoardState(): Promise<{ board: TetrisBoard, current: TetrominoType, next: TetrominoType}> {
    
    const boardString = BinaryTranscoder.encode(this.board);
    
    let result;
    try {
      result = await getTopMovesHybrid(boardString, 18, 0, this.current, this.next, InputSpeed.HZ_30, 343, 3);
    } catch (e) { // no legal moves, reset
      return this.getResetBoardState();
    }
    
    const parsed = decodeStackrabbitResponse(result, this.current, this.next);

    if (parsed.nextBox.length < 3) {
      return this.getResetBoardState();
    }

    const state = { board: this.board.copy(), current: this.current, next: this.next };

    // blit to board and process line clears
    const placement = this.mode === GeneratorMode.NB ? parsed.nextBox[0] : parsed.noNextBox[0];
    
    try {
      placement.firstPlacement.blitToBoard(this.board);
      this.board.processLineClears();
    } catch (e) { // if topout, reset
      return this.getResetBoardState();
    }
    

    // go to next piece
    this.current = this.next;

    // artificially inflate S and Z pieces to make more interesting puzzles
    const rand = Math.random();
    if (rand < 0.2 && this.inflateSZ) {
      this.next = TetrominoType.Z_TYPE;
    } else if (rand < 0.4 && this.inflateSZ) {
      this.next = TetrominoType.S_TYPE;
    } else {
      this.next = getRandomTetrominoType();
    }

    return state;
  }

}