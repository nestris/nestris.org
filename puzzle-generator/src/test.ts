import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { ColorType, TetrisBoard } from "../../shared/tetris/tetris-board";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { getMove, getTopMovesHybrid } from "./stackrabbit";

export async function test() {
  
  const board = new TetrisBoard();
  const current = TetrominoType.I_TYPE;
  const next = TetrominoType.J_TYPE;

  board.setAt(0, 0, ColorType.WHITE);

  const boardString = BinaryTranscoder.encode(board);
  const response = await getMove(boardString, 18, 0, current, next);

  console.log(response);
}

export async function test2() {

  const board = new TetrisBoard();
  board.setAt(5, 18, ColorType.WHITE);
  board.setAt(6, 19, ColorType.WHITE);
  board.print();

  console.log(board.getAverageHeight());

}