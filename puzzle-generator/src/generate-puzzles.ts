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
import { encodePuzzle } from "../../shared/puzzles/encode-puzzle";

let puzzlesGenerated: number;
let puzzlesAddedToDB: number;
let totalPuzzles: number;

const MAKE_HARDER = true;

// generate count number of puzzles
// this function takes a long time to run (approx. 2 seconds per puzzle)
export async function generatePuzzles(count: number): Promise<PartialRatedPuzzle[]> {

  puzzlesGenerated = 0;
  puzzlesAddedToDB = 0;
  totalPuzzles = count;

  const MAX_BAD_PUZZLES_IN_A_ROW = 30; // if this many bad puzzles are generated in a row, reset the board

  // generator generates realistic board states
  let generator = new SequentialBoardGenerator(GeneratorMode.NB, MAKE_HARDER);
  const puzzles: PartialRatedPuzzle[] = [];

  let badPuzzlesInARow = 0;

  for (let i = 0; i < count; i++) {

    //console.log("starting puzzle", i);

    let state;
    if (badPuzzlesInARow >= MAX_BAD_PUZZLES_IN_A_ROW) {

      // board is in too messy of a state. Reset.
      state = generator.getResetBoardState();
      badPuzzlesInARow = 0;
      //console.log("Resetting board due to too many bad puzzles in a row or hit 50 puzzles");

    } else {
      state = await generator.getNextBoardState();
    }
    
    // randomize current and next pieces for more interesting puzzles
    let current = state.current;
    let next = state.next;
    if (MAKE_HARDER) {
      current = getRandomTetrominoType();
      next = getRandomTetrominoType();
    }

    //console.log("Generating puzzle", i);

    // Disallow puzzles with extremely low boards
    if (state.board.getAverageHeight() < 0.5) {
      //console.log("Too low board generated");
      i--;
      badPuzzlesInARow++;
      continue;
    }

    // There are an excessive number of puzzles with low boards generated. Filter half of them out
    if (state.board.getAverageHeight() < 5 && Math.random() < 0.9) {
      //console.log("Too low board generated 2");
      i--;
      badPuzzlesInARow++;
      continue;
    }

    // Disallow puzzles with high boards
    if (state.board.getAverageHeight() > 10) {
      //console.log("Too high board generated");
      i--;
      badPuzzlesInARow++;
      continue;
    }

    // Disallow puzzles with same current and next piece
    if (current === next) {
      //console.log("Same current and next piece generated");
      i--;
      badPuzzlesInARow++;
      continue;
    }
    
    //console.log("rating puzzle", i);
    let rating, details, currentSolution, nextSolution, badReason;
    try {
      ({rating, details, currentSolution, nextSolution, badReason} = await ratePuzzle(state.board, current, next));
    } catch (e) { // if something goes wrong with ratePuzzle, reset the board
      i--;
      badReason = "Error in ratePuzzle: " + e;
      badPuzzlesInARow = MAX_BAD_PUZZLES_IN_A_ROW;
      continue;
    }
    

    // discard bad puzzles
    if (rating === PuzzleRating.BAD_PUZZLE) {

      //console.log("Bad puzzle generated", badReason);

      i--;
      badPuzzlesInARow++;
      continue;
    }

    // reset bad puzzle counter
    badPuzzlesInARow = 0;


    // discard a fraction of rated puzzles due to overabundance
    if (rating === PuzzleRating.ONE_STAR && Math.random() < 0.65) {
      i--;
      continue;
    }
    if (rating === PuzzleRating.TWO_STAR && Math.random() < 0.94) {
      i--;
      continue;
    }
    if (rating === PuzzleRating.THREE_STAR && Math.random() < 0.99) {
      i--;
      continue;
    }
    if (rating === PuzzleRating.FOUR_STAR && Math.random() < 0.94) {
      i--;
      continue;
    }

    const theme = classifyPuzzleTheme(state.board, currentSolution!, nextSolution!, details);

    const puzzle: PartialRatedPuzzle = {
      board: state.board,
      current: current,
      next: next,
      rating: rating,
      theme: theme,
      currentPlacement: currentSolution!,
      nextPlacement: nextSolution!,
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

  const puzzleID = encodePuzzle(puzzle.board, puzzle.current, puzzle.next);
  const currentPlacement = puzzle.currentPlacement.getInt2();
  const nextPlacement = puzzle.nextPlacement.getInt2();

  // add puzzle to database
  const result = await queryDB("INSERT INTO rated_puzzles (id, current_piece, next_piece, rating, theme, current_placement, next_placement) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [puzzleID, currentChar, nextChar, puzzle.rating, puzzle.theme, currentPlacement, nextPlacement]
  );

  puzzlesAddedToDB++;
  if (puzzlesAddedToDB === totalPuzzles) {
    console.log("All puzzles added to database");
  }

  return result;
}
