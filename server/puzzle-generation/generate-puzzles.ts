import { min } from "rxjs";
import { InputSpeed } from "../../network-protocol/models/input-speed";
import { decodeStackrabbitResponse } from "../../network-protocol/stackrabbit-decoder";
import { BinaryTranscoder } from "../../network-protocol/tetris-board-transcoding/binary-transcoder";
import { TetrisBoard } from "../../network-protocol/tetris/tetris-board";
import { ALL_TETROMINO_TYPES, TetrominoType, getRandomTetrominoType } from "../../network-protocol/tetris/tetromino-type";
import { getTopMovesHybrid } from "../puzzles/stackrabbit";
import { Request, Response } from 'express';
import { GeneratorMode, SequentialBoardGenerator } from "./sequential-board-generator";
import { PuzzleRating, ratePuzzle } from "../../network-protocol/puzzles/puzzle-rating";


export interface Puzzle {
  boardString: string;
  current: TetrominoType;
  next: TetrominoType;
  rating: PuzzleRating;
}

export async function generatePuzzles(count: number): Promise<Puzzle[]> {

  const generator = new SequentialBoardGenerator(GeneratorMode.NB);
  const puzzles: Puzzle[] = [];

  for (let i = 0; i < count; i++) {
    const state = await generator.getNextBoardState();

    const current = getRandomTetrominoType();
    const next = getRandomTetrominoType();
    
    const board = BinaryTranscoder.encode(state.board);
    const stackrabbit = await getTopMovesHybrid(board, 18, 0, current, next);
    const decoded = decodeStackrabbitResponse(stackrabbit, current, next);
    const {rating, details} = ratePuzzle(decoded);

    // // discard bad puzzles
    // if (rating === PuzzleRating.BAD_PUZZLE) {
    //   continue;
    // }

    puzzles.push({
      boardString: board,
      current: current,
      next: next,
      rating: rating
    });


    
  }

  return puzzles;
}

export async function generatePuzzlesRoute(req: Request, res: Response) {

  const count = parseInt(req.body['count'] as string);
  console.log("Simulating game with ", count, " placements");

  const puzzles = await generatePuzzles(count);

  res.send(puzzles);

}