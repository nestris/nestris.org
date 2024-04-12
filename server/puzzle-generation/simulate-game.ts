import { min } from "rxjs";
import { InputSpeed } from "../../network-protocol/models/input-speed";
import { decodeStackrabbitResponse } from "../../network-protocol/stackrabbit-decoder";
import { BinaryTranscoder } from "../../network-protocol/tetris-board-transcoding/binary-transcoder";
import { TetrisBoard } from "../../network-protocol/tetris/tetris-board";
import { TetrominoType, getRandomTetrominoType } from "../../network-protocol/tetris/tetromino-type";
import { getTopMovesHybrid } from "../puzzles/stackrabbit";
import { Request, Response } from 'express';



export interface SerializedGame {
  startLevel: number;
  placements: SerializedGamePlacement[];
}

export interface SerializedGamePlacement {
  boardString: string;
  current: TetrominoType;
  next: TetrominoType;
  r: number;
  x: number;
  y: number;
}

export function simulateGame(numPlacements: number): SerializedGame {

  let placements: SerializedGamePlacement[] = [];

  const board = new TetrisBoard();
  let current: TetrominoType = getRandomTetrominoType();
  let next: TetrominoType = getRandomTetrominoType();

  // randomize bottom row
  for (let i = 0; i < 9; i++) {
    if (Math.random() < 0.5) {
      board.setAt(i, 19, 1);
    }
  }

  // simulate game
  for (let i = 0; i < numPlacements; i++) {
    const boardString = BinaryTranscoder.encode(board);
    const result = getTopMovesHybrid(boardString, 18, 0, current, next, InputSpeed.HZ_30, 343, 3);
    const parsed = decodeStackrabbitResponse(result, current, next);

    if (parsed.nextBox.length < 2) {
      console.log("Game over");
      break;
    }

    // 70% chance 0, 30% chance 1
    const index = Math.random() < 0.7 ? 0 : 1;
    const best = parsed.noNextBox[0];

    // save placement
    placements.push({
      boardString: boardString,
      current: current,
      next: next,
      r: best.firstPlacement.getRotation(),
      x: best.firstPlacement.getTranslateX(),
      y: best.firstPlacement.getTranslateY()
    });


    // blit to board and process line clears
    best.firstPlacement.blitToBoard(board);
    board.processLineClears();

    // go to next piece
    current = next;
    next = getRandomTetrominoType();

    // board.print();
  }

  return {
    startLevel: 18,
    placements: placements
  };
}

export async function simulateGameRoute(req: Request, res: Response) {

  const count = parseInt(req.body['count'] as string);
  console.log("Simulating game with ", count, " placements");

  const game = simulateGame(count);

  res.send(game);

}