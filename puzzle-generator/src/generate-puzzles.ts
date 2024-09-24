import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { BufferTranscoder } from "../../shared/network/tetris-board-transcoding/buffer-transcoder";
import { PuzzleRating } from "../../shared/puzzles/puzzle-rating";
import { TetrominoType, getRandomTetrominoType } from "../../shared/tetris/tetromino-type";
import { TETROMINO_CHAR } from "../../shared/tetris/tetrominos";
import { queryDB } from "./database";
import { classifyPuzzleTheme } from "./classify-puzzle-theme";
import { ratePuzzle } from "./rate-puzzle";
import { SequentialBoardGenerator, GeneratorMode } from "./sequential-board-generator";
import { PartialRatedPuzzle } from '../../shared/puzzles/partial-rated-puzzle';

let puzzlesGenerated: number;
let puzzlesAddedToDB: number;
let totalPuzzles: number;


// generate count number of puzzles
// this function takes a long time to run (approx. 2 seconds per puzzle)
export async function generatePuzzles(count: number): Promise<PartialRatedPuzzle[]> {

  puzzlesGenerated = 0;
  puzzlesAddedToDB = 0;
  totalPuzzles = count;

  const MAX_BAD_PUZZLES_IN_A_ROW = 30; // if this many bad puzzles are generated in a row, reset the board

  // generator generates realistic board states
  const generator = new SequentialBoardGenerator();
  const puzzles: PartialRatedPuzzle[] = [];

  let badPuzzlesInARow = 0;

  for (let i = 0; i < count; i++) {

    let state;
    if (badPuzzlesInARow >= MAX_BAD_PUZZLES_IN_A_ROW) {
      // board is in too messy of a state. Reset.
      state = generator.getResetBoardState();
      badPuzzlesInARow = 0;
      console.log("Resetting board due to too many bad puzzles in a row");
    } else {
      state = await generator.getNextBoardState();
    }
    
    // randomize current and next pieces for more interesting puzzles
    const current = getRandomTetrominoType();
    const next = getRandomTetrominoType();

    let rating, details, currentSolution, nextSolution;
    try {
      ({rating, details, currentSolution, nextSolution} = await ratePuzzle(state.board, current, next));
    } catch (e) { // if something goes wrong with ratePuzzle, reset the board
      i--;
      badPuzzlesInARow = MAX_BAD_PUZZLES_IN_A_ROW;
      continue;
    }
    

    // discard bad puzzles
    if (rating === PuzzleRating.BAD_PUZZLE) {
      i--;
      badPuzzlesInARow++;
      continue;
    }

    // reset bad puzzle counter
    badPuzzlesInARow = 0;

    // discard a fraction of 3 and 4 star puzzles due to overabundance
    if ((rating === PuzzleRating.THREE_STAR && Math.random() < 0.6) || (rating === PuzzleRating.FOUR_STAR && Math.random() < 0.3)) {
      i--;
      continue;
    }

    const theme = classifyPuzzleTheme(state.board, currentSolution!, nextSolution!, details);

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
    console.log(`Generated puzzle ${++puzzlesGenerated}/${count} with rating ${rating}`);

    addRatedPuzzleToDatabase(puzzle); // start adding to database in the background
  }

  return puzzles;
}

async function addRatedPuzzleToDatabase(puzzle: PartialRatedPuzzle): Promise<any> {
  const currentChar = TETROMINO_CHAR[puzzle.current];
  const nextChar = TETROMINO_CHAR[puzzle.next];
  const boardBuffer = BufferTranscoder.encode(BinaryTranscoder.decode(puzzle.boardString));

  // add puzzle to database
  const result = await queryDB("INSERT INTO rated_puzzles (board, current_piece, next_piece, rating, theme, r1, x1, y1, r2, x2, y2) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
    [boardBuffer, currentChar, nextChar, puzzle.rating, puzzle.theme, puzzle.r1, puzzle.x1, puzzle.y1, puzzle.r2, puzzle.x2, puzzle.y2]
  );

  console.log(`Added puzzle ${++puzzlesAddedToDB}/${totalPuzzles} to database`);

  return result;
}
