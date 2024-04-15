import { TetrominoType } from "../../network-protocol/tetris/tetromino-type";
import { PuzzleRating, PuzzleRatingDetails } from "../../network-protocol/puzzles/puzzle-rating";
import { TetrisBoard } from "../../network-protocol/tetris/tetris-board";
import { BinaryTranscoder } from "../../network-protocol/tetris-board-transcoding/binary-transcoder";
import { getTopMovesHybrid } from "../puzzles/stackrabbit";
import { TopMovesHybridResponse, decodeStackrabbitResponse } from "../../network-protocol/stackrabbit-decoder";
import { InputSpeed } from "../../network-protocol/models/input-speed";

export async function ratePuzzle(board: TetrisBoard, current: TetrominoType, next: TetrominoType):
    Promise<{rating: PuzzleRating, details: PuzzleRatingDetails}>
  {

  const boardString = BinaryTranscoder.encode(board);

  let stackrabbit: TopMovesHybridResponse;
  try {
    const stackrabbitRaw = await getTopMovesHybrid(boardString, 18, 0, current, next);
    stackrabbit = decodeStackrabbitResponse(stackrabbitRaw, current, next);
  } catch (e) {
    return {rating: PuzzleRating.BAD_PUZZLE, details: {
      bestNB: -1,
      diff: -1,
      isAdjustment: false,
      rating: PuzzleRating.UNRATED
    }};
  }
  

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

  const details: PuzzleRatingDetails = {bestNB, diff, isAdjustment, rating: PuzzleRating.UNRATED};

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
  4 star: (diff 3-10) or (bestNB > 0) or not adjustment
  5 star: otherwise
  else: BAD_PUZZLE
  */

  let rating: PuzzleRating;
  if (diff >= 30 && !isAdjustment) rating = PuzzleRating.ONE_STAR;
  else if ((diff >= 30) || (diff >= 10 && diff <= 30 && !isAdjustment && bestNB > 20)) rating = PuzzleRating.TWO_STAR;
  else if ((diff >= 10 && diff <= 30) || (diff >= 3 && diff <= 10 && !isAdjustment) || obviousFirstMove) rating = PuzzleRating.THREE_STAR;
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

  details.rating = rating;
  return {rating, details};
}