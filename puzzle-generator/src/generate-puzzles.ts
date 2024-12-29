import { PuzzleRating, PuzzleRatingDetails } from "../../shared/puzzles/puzzle-rating";
import { getRandomTetrominoType, TetrominoType } from "../../shared/tetris/tetromino-type";
import { classifyPuzzleTheme } from "./classify-puzzle-theme";
import { ratePuzzle } from "./rate-puzzle";
import { DBPuzzleBuilder } from "../../shared/puzzles/db-puzzle";
import { SequentialBoardGenerator, GeneratorMode } from "./sequential-board-generator";
import { TopMovesHybridResponse } from "../../shared/scripts/stackrabbit-decoder";
import { PuzzleTheme } from "../../shared/puzzles/puzzle-theme";
import { TetrisBoard } from "../../shared/tetris/tetris-board";
import { encodePuzzle } from "../../shared/puzzles/encode-puzzle";


const MAKE_HARDER = true;

// generate count number of puzzles
// this function takes a long time to run (approx. 2 seconds per puzzle)
export async function generatePuzzles(count: number): Promise<DBPuzzleBuilder[]> {

  let puzzlesGenerated: number = 0;

  const MAX_BAD_PUZZLES_IN_A_ROW = 30; // if this many bad puzzles are generated in a row, reset the board

  // generator generates realistic board states
  let generator = new SequentialBoardGenerator(GeneratorMode.NB, MAKE_HARDER);
  const puzzles: DBPuzzleBuilder[] = [];

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
    
    const height = state.board.getAverageHeight();

    // Disallow puzzles with extremely low boards
    if (height < 0.5) {
      //console.log("Too low board generated");
      i--;
      badPuzzlesInARow++;
      continue;
    }

    // There are an excessive number of puzzles with low boards generated. Filter half of them out
    if (height < 5 && Math.random() < 0.9) {
      //console.log("Too low board generated 2");
      i--;
      badPuzzlesInARow++;
      continue;
    }

    // Disallow puzzles with high boards
    if (height > 10) {
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
    let rating: PuzzleRating;
    let stackrabbit: TopMovesHybridResponse;
    let details: PuzzleRatingDetails;
    try {
      const response = await ratePuzzle(state.board, current, next);
      if (typeof response === "string") {
        throw new Error(response);
      }

      ({ rating, details, stackrabbit } = response);

    } catch (e) { // if something goes wrong with ratePuzzle, reset the board
      i--;
      badPuzzlesInARow = MAX_BAD_PUZZLES_IN_A_ROW;
      continue;
    }
    

    // reset bad puzzle counter
    badPuzzlesInARow = 0;


    // discard a fraction of rated puzzles due to overabundance
    if (rating === PuzzleRating.ONE_STAR && Math.random() < 0.6) {
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
    if (rating === PuzzleRating.FOUR_STAR && Math.random() < 0.92) {
      i--;
      continue;
    }

    const theme = classifyPuzzleTheme(state.board, details);

    const puzzle: DBPuzzleBuilder = {
      id: encodePuzzle(state.board, current, next),
      rating: rating,
      theme: theme,
      current_1: stackrabbit.nextBox[0].firstPlacement.getInt2(),
      next_1: stackrabbit.nextBox[0].secondPlacement.getInt2(),
      current_2: stackrabbit.nextBox[1].firstPlacement.getInt2(),
      next_2: stackrabbit.nextBox[1].secondPlacement.getInt2(),
      current_3: stackrabbit.nextBox[2].firstPlacement.getInt2(),
      next_3: stackrabbit.nextBox[2].secondPlacement.getInt2(),
      current_4: stackrabbit.nextBox[3].firstPlacement.getInt2(),
      next_4: stackrabbit.nextBox[3].secondPlacement.getInt2(),
      current_5: stackrabbit.nextBox[4].firstPlacement.getInt2(),
      next_5: stackrabbit.nextBox[4].secondPlacement.getInt2(),
    };

    puzzles.push(puzzle);
    console.log(`Generated puzzle ${++puzzlesGenerated}/${count} with rating ${rating}`);
  }

  return puzzles;
}