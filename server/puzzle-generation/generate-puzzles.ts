import { BinaryTranscoder } from "../../network-protocol/tetris-board-transcoding/binary-transcoder";
import { TetrominoType, getRandomTetrominoType } from "../../network-protocol/tetris/tetromino-type";
import { Request, Response } from 'express';
import { GeneratorMode, SequentialBoardGenerator } from "./sequential-board-generator";
import { RatedPuzzle } from "../../network-protocol/puzzles/rated-puzzle";
import { ratePuzzle } from "./rate-puzzle";
import { PuzzleRating } from "../../network-protocol/puzzles/puzzle-rating";
import { classifyPuzzleTheme } from "./classify-puzzle-theme";
import { queryDB } from "../database";
import { PuzzleTheme } from "../../network-protocol/puzzles/puzzle-theme";

// interface for rated puzzle before it is added to the database
export interface PartialRatedPuzzle {
  boardString: string;
  current: TetrominoType;
  next: TetrominoType;
  rating: PuzzleRating;
  theme: PuzzleTheme;
  r1: number;
  x1: number;
  y1: number;
  r2: number;
  x2: number;
  y2: number;
}

// generate count number of puzzles
// this function takes a long time to run (approx. 2 seconds per puzzle)
export async function generatePuzzles(count: number): Promise<PartialRatedPuzzle[]> {

  const MAX_BAD_PUZZLES_IN_A_ROW = 30; // if this many bad puzzles are generated in a row, reset the board

  // generator generates realistic board states
  const generator = new SequentialBoardGenerator(GeneratorMode.NB);
  const puzzles: PartialRatedPuzzle[] = [];

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

    const {rating, details, currentSolution, nextSolution} = await ratePuzzle(state.board, current, next);

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

    const theme = classifyPuzzleTheme(state.board, currentSolution!, nextSolution!);

    puzzles.push({
      boardString: BinaryTranscoder.encode(state.board),
      current: current,
      next: next,
      rating: rating,
      theme: theme,
      r1: currentSolution!.getRotation(),
      x1: currentSolution!.getTranslateX(),
      y1: currentSolution!.getTranslateY(),
      r2: nextSolution!.getRotation(),
      x2: nextSolution!.getTranslateX(),
      y2: nextSolution!.getTranslateY(),
    });

    console.log("Puzzle count: ", puzzles.length, "Rating: ", rating);
  }

  return puzzles;
}

export async function generatePuzzlesRoute(req: Request, res: Response) {

  const count = parseInt(req.body['count'] as string);
  console.log("Simulating game with ", count, " placements");

  const puzzles = await generatePuzzles(count);

  // add puzzles to database at the same time
  await queryDB("INSERT INTO rated_puzzles (board, current_piece, next_piece, rating, theme, r1, x1, y1, r2, x2, y2) VALUES " +
    puzzles.map(p => `('${p.boardString}', '${p.current}', '${p.next}', '${p.rating}', '${p.theme}', ${p.r1}, ${p.x1}, ${p.y1}, ${p.r2}, ${p.x2}, ${p.y2})`).join(", ")
  );

  // send the partial rated puzzles to the client
  res.send(puzzles);

}