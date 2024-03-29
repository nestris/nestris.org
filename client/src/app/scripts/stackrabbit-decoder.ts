import { InputSpeed } from "network-protocol/models/input-speed";
import { TetrisBoard } from "../models/tetris/tetris-board";
import { BinaryTranscoder } from "../models/tetris/tetris-board-transcoding/binary-transcoder";
import { Method, fetchServer } from "./fetch-server";
import MoveableTetromino from "../models/tetris/moveable-tetromino";
import { TetrominoType } from "../models/tetris/tetromino-type";

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

  return {
    nextBox: (response.content['nextBox'] as any[]).map((move: any) => { return {
      firstPlacement: MoveableTetromino.fromStackRabbitPose(currentPiece, move['firstPlacement'][0] as number, move['firstPlacement'][1] as number, move['firstPlacement'][2] as number),
      secondPlacement: MoveableTetromino.fromStackRabbitPose(nextPiece, move['secondPlacement'][0] as number, move['secondPlacement'][1] as number, move['secondPlacement'][2] as number),
      score: move['playoutScore'] as number
    }}),
    noNextBox : (response.content['noNextBox'] as any[]).map((move: any) => { return {
      firstPlacement: MoveableTetromino.fromStackRabbitPose(currentPiece, move['firstPlacement'][0], move['firstPlacement'][1], move['firstPlacement'][2]),
      score: move['playoutScore'] as number
    }})
  }

}


