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
import { decodeRatedPuzzleFromDB } from "./decode-rated-puzzle";
import { TETROMINO_CHAR } from "../../network-protocol/tetris/tetrominos";
import { BufferTranscoder } from "../../network-protocol/tetris-board-transcoding/buffer-transcoder";

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
      console.log("Resetting board");
      badPuzzlesInARow = 0;
    } else {
      state = await generator.getNextBoardState();
    }
    
    console.log("Generating new puzzle");

    // randomize current and next pieces for more interesting puzzles
    const current = getRandomTetrominoType();
    const next = getRandomTetrominoType();

    const {rating, details, currentSolution, nextSolution} = await ratePuzzle(state.board, current, next);

    // discard bad puzzles
    if (rating === PuzzleRating.BAD_PUZZLE) {
      i--;
      console.log("Bad puzzle, retrying");
      badPuzzlesInARow++;
      continue;
    }

    // reset bad puzzle counter
    badPuzzlesInARow = 0;

    // discard a fraction of 3 and 4 star puzzles due to overabundance
    if ((rating === PuzzleRating.THREE_STAR && Math.random() < 0.6) || (rating === PuzzleRating.FOUR_STAR && Math.random() < 0.3)) {
      i--;
      console.log(`Discarding ${rating} star puzzle`);
      continue;
    }

    const theme = classifyPuzzleTheme(state.board, currentSolution!, nextSolution!);

    const puzzle: PartialRatedPuzzle = {
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
    };

    puzzles.push(puzzle);
    addRatedPuzzleToDatabase(puzzle); // start adding to database in the background

    console.log("Puzzle count: ", puzzles.length, "Rating: ", rating);
  }

  return puzzles;
}

async function addRatedPuzzleToDatabase(puzzle: PartialRatedPuzzle) {
  const currentChar = TETROMINO_CHAR[puzzle.current];
  const nextChar = TETROMINO_CHAR[puzzle.next];
  const boardBuffer = BufferTranscoder.encode(BinaryTranscoder.decode(puzzle.boardString));

  // add puzzle to database
  const result = await queryDB("INSERT INTO rated_puzzles (board, current_piece, next_piece, rating, theme, r1, x1, y1, r2, x2, y2) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
    [boardBuffer, currentChar, nextChar, puzzle.rating, puzzle.theme, puzzle.r1, puzzle.x1, puzzle.y1, puzzle.r2, puzzle.x2, puzzle.y2]
  );

  return result;
}

export async function generatePuzzlesRoute(req: Request, res: Response) {

  const count = parseInt(req.body['count'] as string);
  console.log("Simulating game with ", count, " placements");

  const puzzles = await generatePuzzles(count);

  // send the partial rated puzzles to the client
  res.send(puzzles);

}

// TODO: pagination
export async function getRatedPuzzlesListRoute(req: Request, res: Response) {

  //const result = await queryDB("SELECT * FROM rated_puzzles");

  // select all from rated puzzles, with two additional attributes for each puzzle:
  // report_count, which is the count for puzzle_attempts with the same puzzle_id where user_rating is -1
  // average_user_rating, which is the average of user_rating for puzzle_attempts with the same puzzle_id ignoring user_ratings below 1
  // write the query across multiple lines for readability
  // order by rating
  const result = await queryDB(
    "SELECT * " +
    "FROM rated_puzzles " + 
    "ORDER BY rating ASC " + 
    "LIMIT 100"
  );


  const puzzles: RatedPuzzle[] = result.rows.map((row: any) => decodeRatedPuzzleFromDB(row));
  res.send(puzzles);
}