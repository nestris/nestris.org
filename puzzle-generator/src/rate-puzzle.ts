import { InputSpeed } from "../../shared/models/input-speed";
import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { PuzzleRating, PuzzleRatingDetails } from "../../shared/puzzles/puzzle-rating";
import { TopMovesHybridResponse, decodeStackrabbitResponse } from "../../shared/scripts/stackrabbit-decoder";
import MoveableTetromino from "../../shared/tetris/moveable-tetromino";
import { TetrisBoard } from "../../shared/tetris/tetris-board";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { getTopMovesHybrid } from "./stackrabbit";


// checks if placing the piece would clear lines and result in a burn
function hasBurn(board: TetrisBoard, placement: MoveableTetromino): boolean {
  const boardCopy = board.copy();
  placement.blitToBoard(boardCopy);
  return boardCopy.processLineClears() > 0;
}

// checks if moving the piece up one row would intersect with the board, which means it's a tuck or spin
function hasTuckOrSpin(board: TetrisBoard, placement: MoveableTetromino): boolean {
  const oneHigherPlacement = new MoveableTetromino(placement.tetrominoType, placement.getRotation(), placement.getTranslateX(), placement.getTranslateY() - 1);
  return oneHigherPlacement.intersectsBoard(board);
}

// Checks if first and second placements are interchangeable
function placementsInterchangeable(board: TetrisBoard, first: MoveableTetromino, second: MoveableTetromino): boolean {
  
  // Make placements 
  const board1 = board.copy();
  first.blitToBoard(board1);
  board1.processLineClears();
  second.blitToBoard(board1);
  board1.processLineClears();

  // Make placements in reverse order, and if illegal, placements are not interchangeable
  const board2 = board.copy();
  if (!second.isValidPlacement(board2)) return false;
  second.blitToBoard(board2);
  board2.processLineClears();
  if (!first.isValidPlacement(board2)) return false;
  first.blitToBoard(board2);
  board2.processLineClears();

  // If placing the pieces in reverse order results in the same board, placements are interchangeable
  return board1.equals(board2);
}

export async function ratePuzzle(board: TetrisBoard, current: TetrominoType, next: TetrominoType):
    Promise<{
      rating: PuzzleRating,
      details: PuzzleRatingDetails,
      currentSolution?: MoveableTetromino,
      nextSolution?: MoveableTetromino
    }>
  {

  const boardString = BinaryTranscoder.encode(board);

  let stackrabbitRaw: any;
  let stackrabbit: TopMovesHybridResponse;
  try {
    stackrabbitRaw = await getTopMovesHybrid(boardString, 18, 0, current, next);
    stackrabbit = decodeStackrabbitResponse(stackrabbitRaw, current, next);
  } catch (e) {
    console.log("Error in ratePuzzle: ", e, stackrabbitRaw);
    throw new Error(`Error in ratePuzzle: ${e}`);
  }
  
  // get the board after the first move
  const boardAfterFirst = board.copy();
  stackrabbit.nextBox[0].firstPlacement.blitToBoard(boardAfterFirst);
  boardAfterFirst.processLineClears();

  const hasAnyBurn = hasBurn(board, stackrabbit.nextBox[0].firstPlacement) || hasBurn(boardAfterFirst, stackrabbit.nextBox[0].secondPlacement);
  const hasAnyTuckOrSpin = hasTuckOrSpin(board, stackrabbit.nextBox[0].firstPlacement) || hasTuckOrSpin(boardAfterFirst, stackrabbit.nextBox[0].secondPlacement);

  const bestNB = stackrabbit.nextBox[0].score;
  const bestNNB = stackrabbit.noNextBox[0].score;

  // adjustment: the best placement for the first piece, when rated as NNB move, is at least 10 points worse than best NNB
  // also, if best placement for first piece is not even considered in NNB moves, then definitely an adjustment
  const bestMoveNNBIndex = stackrabbit.noNextBox.findIndex(move => move.firstPlacement.equals(stackrabbit.nextBox[0].firstPlacement));
  const isAdjustment = bestMoveNNBIndex === -1 || (bestNNB - stackrabbit.noNextBox[bestMoveNNBIndex].score) >= 4;

  // get the diff between the top two moves. If there are less than two moves, return BAD_PUZZLE
  let diff: number;
  if (stackrabbit.nextBox.length >= 2) diff = stackrabbit.nextBox[0].score - stackrabbit.nextBox[1].score;
  else diff = -1;

  let diffNNB: number | undefined;
  if (stackrabbit.noNextBox.length >= 2) diffNNB = stackrabbit.noNextBox[0].score - stackrabbit.noNextBox[1].score;
  else diffNNB = undefined;

  // whether the first move is also best NNB move by far
  const obviousFirstMove = (bestMoveNNBIndex === 0 && diffNNB !== undefined && diffNNB >= 0.5);

  const details: PuzzleRatingDetails = {bestNB, diff, isAdjustment,
     rating: PuzzleRating.UNRATED,
     hasBurn: hasAnyBurn,
      hasTuckOrSpin: hasAnyTuckOrSpin
  };

  // if diff is too small, zero, or negative, return BAD_PUZZLE
  if (diff <= 0.5) return {rating: PuzzleRating.BAD_PUZZLE, details};

  // if bestNB is too low, return BAD_PUZZLE
  if (bestNB < -50) return {rating: PuzzleRating.BAD_PUZZLE, details};

  // eliminate puzzles where the first placement is I-0
  if (stackrabbit.nextBox[0].firstPlacement.getTetrisNotation() === "I-0") {
    return {rating: PuzzleRating.BAD_PUZZLE, details};
  }

  // eliminate puzzles where the second placement is I-0
  if (stackrabbit.nextBox[0].secondPlacement.getTetrisNotation() === "I-0") {
    return {rating: PuzzleRating.BAD_PUZZLE, details};
  }

  // // eliminate puzzles where top two NB moves have the same second placement
  // if (stackrabbit.nextBox[0].secondPlacement.equals(stackrabbit.nextBox[1].secondPlacement)) return {rating: PuzzleRating.BAD_PUZZLE, details};

  /*
  RATING SYSTEM

  1 star: diff 30+ and not adjustment
  2 star: (diff 30+) or (diff 10-30 and not adjustment and bestNB > 20)
  3 star: (diff 10-30) or (diff 1-10 and not adjustment and bestNB > 10)
  4 star: baby rabbit gets the puzzle correct
  5 star: baby rabbit gets the puzzle wrong
  else: BAD_PUZZLE
  */

  let rating: PuzzleRating;
  if (diff >= 20 && !isAdjustment && bestNB > 20 && !hasAnyBurn && !hasAnyTuckOrSpin) rating = PuzzleRating.ONE_STAR;
  else if ((diff >= 20) || (diff >= 10 && !isAdjustment && bestNB > 20 && !hasAnyBurn && !hasAnyTuckOrSpin)) rating = PuzzleRating.TWO_STAR;
  else if ((diff >= 10) || (diff >= 3 && !isAdjustment)) rating = PuzzleRating.THREE_STAR;
  else {
    // at this point, the puzzle is either 4 or 5 star
    // use a nerfed version of SR to determine if the puzzle is 4 or 5 star

    let babyrabbit: TopMovesHybridResponse; // nerfed version of SR with 1-ply depth
    try {
      const babyrabbitRaw = await getTopMovesHybrid(boardString, 18, 0, current, next, InputSpeed.HZ_30, 7, 1);
      babyrabbit = decodeStackrabbitResponse(babyrabbitRaw, current, next);

      // find the index of the best move in the babyrabbit response
      const babyRabbitIndex = babyrabbit.nextBox.findIndex(move => (
        move.firstPlacement.equals(stackrabbit.nextBox[0].firstPlacement)
        && move.secondPlacement.equals(stackrabbit.nextBox[0].secondPlacement)
      ));

      // if the best move is not in the baby rabbit response, means the best move is really hard to find
      if (babyRabbitIndex === -1) rating = PuzzleRating.FIVE_STAR;

      else {
        // get the diff between the baby rabbit best move and the actual best move
        const babyRabbitDiff = babyrabbit.nextBox[0].score - babyrabbit.nextBox[babyRabbitIndex].score;

        // if difference is positive, means that the actual best move is not the best move in the baby rabbit response
        // if the difference is positive enough, assign the puzzle a 5 star rating
        if (babyRabbitDiff >= 1) rating = PuzzleRating.FIVE_STAR;
        else rating = PuzzleRating.FOUR_STAR;
      }
    } catch {
      return {rating: PuzzleRating.BAD_PUZZLE, details};
    }
  }

  // the puzzle solution
  const currentSolution = stackrabbit.nextBox[0].firstPlacement;
  const nextSolution = stackrabbit.nextBox[0].secondPlacement;

  // return the rating with details and solution
  details.rating = rating;
  return {rating, details, currentSolution, nextSolution};
}