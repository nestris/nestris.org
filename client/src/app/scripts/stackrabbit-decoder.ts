import { InputSpeed } from "network-protocol/models/input-speed";
import { TetrisBoard } from "../../../../network-protocol/tetris/tetris-board";
import { BinaryTranscoder } from "../../../../network-protocol/tetris-board-transcoding/binary-transcoder";
import { Method, fetchServer } from "./fetch-server";
import MoveableTetromino from "../../../../network-protocol/tetris/moveable-tetromino";
import { TetrominoType } from "../../../../network-protocol/tetris/tetromino-type";
import { decodeStackrabbitResponse } from "network-protocol/stackrabbit-decoder";

export interface TopMovesHybridResponse {
  nextBox: {
    firstPlacement: MoveableTetromino,
    secondPlacement: MoveableTetromino,
    score: number
  }[],
  noNextBox: {
    firstPlacement: MoveableTetromino,
    score: number
  }[]
}

export async function getTopMovesHybrid(
  board: TetrisBoard,
  level: number,
  lines: number,
  currentPiece: TetrominoType,
  nextPiece: TetrominoType,
  inputSpeed: InputSpeed = InputSpeed.HZ_30,
  playoutCount: number = 343,
  depth: number = 3
): Promise<TopMovesHybridResponse> {

  const response = await fetchServer(Method.GET, '/api/v2/stackrabbit/get-top-moves-hybrid', {
    boardString: BinaryTranscoder.encode(board),
    level: level,
    lines: lines,
    currentPiece: currentPiece,
    nextPiece: nextPiece,
    inputSpeed: inputSpeed,
    playoutCount: playoutCount,
    depth: depth
  });

  if (response.status >= 399) {
    throw new Error("Error getting top moves hybrid");
  }

  return decodeStackrabbitResponse(response.content, currentPiece, nextPiece);

}


