import { InputSpeed } from "../shared/models/input-speed";
import { BinaryTranscoder } from "../shared/network/tetris-board-transcoding/binary-transcoder";
import { decodeStackrabbitResponse } from "../shared/scripts/stackrabbit-decoder";
import MoveableTetromino from "../shared/tetris/moveable-tetromino";
import { TetrisBoard } from "../shared/tetris/tetris-board";
import { TetrominoType } from "../shared/tetris/tetromino-type";
import { fetchServer2, Method } from "./fetch-server";


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

  const response = await fetchServer2(Method.GET, '/api/v2/stackrabbit/get-top-moves-hybrid', {
    boardString: BinaryTranscoder.encode(board),
    level: level,
    lines: lines,
    currentPiece: currentPiece,
    nextPiece: nextPiece,
    inputSpeed: inputSpeed,
    playoutCount: playoutCount,
    depth: depth
  });

  return decodeStackrabbitResponse(response, currentPiece, nextPiece);

}


