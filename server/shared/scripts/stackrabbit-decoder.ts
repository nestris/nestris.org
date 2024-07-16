import MoveableTetromino from "../tetris/moveable-tetromino";
import { TetrominoType } from "../tetris/tetromino-type";

/*
Converts raw response from StackRabbit into a more usable format
*/

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

// raw response from getTopMovesHybrid
export function decodeStackrabbitResponse(response: any, current: TetrominoType, next: TetrominoType): TopMovesHybridResponse {

  if (typeof response === 'string' || response instanceof String) {
    response = JSON.parse(response as string);
  }

  return {
    nextBox: (response['nextBox'] as any[]).map((move: any) => { return {
      firstPlacement: MoveableTetromino.fromStackRabbitPose(current, move['firstPlacement'][0] as number, move['firstPlacement'][1] as number, move['firstPlacement'][2] as number),
      secondPlacement: MoveableTetromino.fromStackRabbitPose(next, move['secondPlacement'][0] as number, move['secondPlacement'][1] as number, move['secondPlacement'][2] as number),
      score: move['playoutScore'] as number
    }}),
    noNextBox : (response['noNextBox'] as any[]).map((move: any) => { return {
      firstPlacement: MoveableTetromino.fromStackRabbitPose(current, move['firstPlacement'][0], move['firstPlacement'][1], move['firstPlacement'][2]),
      score: move['playoutScore'] as number
    }})
  }
}


