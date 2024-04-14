import { TopMovesHybridResponse } from "network-protocol/stackrabbit-decoder";
import { TetrisBoard } from "network-protocol/tetris/tetris-board";
import { TetrominoType } from "network-protocol/tetris/tetromino-type";
import { unescape } from "querystring";

export enum PuzzleRating {
  BAD_PUZZLE = -1,
  UNRATED = 0,
  ONE_STAR = 1,
  TWO_STAR = 2,
  THREE_STAR = 3,
  FOUR_STAR = 4,
  FIVE_STAR = 5,
}

export interface PuzzleRatingDetails {
  bestNB: number;
  diff: number;
  isAdjustment: boolean;
  rating: PuzzleRating;
}

export function ratePuzzle(stackrabbit: TopMovesHybridResponse): {rating: PuzzleRating, details: PuzzleRatingDetails} {

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
  else if ((diff >= 3 && diff <= 10) || (bestNB > 10) || !isAdjustment) rating = PuzzleRating.FOUR_STAR;
  else rating = PuzzleRating.FIVE_STAR;

  details.rating = rating;
  return {rating, details};
}