import { BinaryTranscoder } from "../../network-protocol/tetris-board-transcoding/binary-transcoder";
import { getRandomTetrominoType } from "../../network-protocol/tetris/tetromino-type";
import { Request, Response } from 'express';
import { GeneratorMode, SequentialBoardGenerator } from "./sequential-board-generator";
import { Puzzle } from "../../network-protocol/puzzles/puzzle";
import { ratePuzzle } from "./rate-puzzle";
import { PuzzleRating } from "../../network-protocol/puzzles/puzzle-rating";

export async function generatePuzzles(count: number): Promise<Puzzle[]> {

  const MAX_BAD_PUZZLES_IN_A_ROW = 30;

  // generator generates realistic board states
  const generator = new SequentialBoardGenerator(GeneratorMode.NB);
  const puzzles: Puzzle[] = [];

  let badPuzzlesInARow = 0;

  for (let i = 0; i < count; i++) {

    let state;
    if (badPuzzlesInARow > MAX_BAD_PUZZLES_IN_A_ROW) {
      // board is in too messy of a state. Reset.
      state = generator.getResetBoardState();
      badPuzzlesInARow = 0;
    } else {
      state = await generator.getNextBoardState();
    }

    // randomize current and next pieces for more interesting puzzles
    const current = getRandomTetrominoType();
    const next = getRandomTetrominoType();

    const {rating, details} = await ratePuzzle(state.board, current, next);

    // discard bad puzzles
    if (rating === PuzzleRating.BAD_PUZZLE) {
      i--;
      badPuzzlesInARow++;
      continue;
    }

    // reset bad puzzle counter
    badPuzzlesInARow = 0;

    // discard a fraction of 3 star puzzles due to overabundance
    if (rating === PuzzleRating.THREE_STAR && Math.random() < 0.8) {
      i--;
      continue;
    }

    puzzles.push({
      boardString: BinaryTranscoder.encode(state.board),
      current: current,
      next: next,
      rating: rating
    });

    console.log("Puzzle count: ", puzzles.length, "Rating: ", rating);
  }

  return puzzles;
}

export async function generatePuzzlesRoute(req: Request, res: Response) {

  const count = parseInt(req.body['count'] as string);
  console.log("Simulating game with ", count, " placements");

  const puzzles = await generatePuzzles(count);

  res.send(puzzles);

}