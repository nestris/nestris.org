import { InputSpeed } from "../../shared/models/input-speed";
import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { PuzzleRating, PuzzleRatingDetails } from "../../shared/puzzles/puzzle-rating";
import { TopMovesHybridResponse, decodeStackrabbitResponse } from "../../shared/scripts/stackrabbit-decoder";
import MoveableTetromino from "../../shared/tetris/moveable-tetromino";
import { ColorType, TetrisBoard } from "../../shared/tetris/tetris-board";
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
  if (oneHigherPlacement.intersectsBoard(board)) return true;

  // Check if any of the blocks for the placement does not have a block below it. This means it's a tuck or spin
  for (const block of placement.getCurrentBlockSet().blocks) {
    const x = block.x + placement.getTranslateX();
    const y = block.y + placement.getTranslateY();
    if (y < 20 && board.getAt(x, y + 1) === ColorType.EMPTY) return true;
  }

  return false;
}

async function getStackrabbitResponse(
  board: TetrisBoard,
  currentPiece: TetrominoType,
  nextPiece: TetrominoType,
  inputSpeed: InputSpeed = InputSpeed.HZ_30,
  playoutCount: number = 343,
  depth: number = 3
): Promise<TopMovesHybridResponse> {

  const boardString = BinaryTranscoder.encode(board);

  try {
    const response = await getTopMovesHybrid(boardString, 18, 0, currentPiece, nextPiece, inputSpeed, playoutCount, depth);
    return decodeStackrabbitResponse(response, currentPiece, nextPiece);
  } catch (e) {
    console.log("Error in getStackrabbitResponse: ", e);
    throw new Error(`Error in getStackrabbitResponse: ${e}`);
  }
}

export async function ratePuzzle(board: TetrisBoard, current: TetrominoType, next: TetrominoType):
    Promise<{
      rating: PuzzleRating,
      details: PuzzleRatingDetails,
      currentSolution?: MoveableTetromino,
      nextSolution?: MoveableTetromino,
      badReason?: string
    }>
  {

  const stackrabbit = await getStackrabbitResponse(board, current, next);
  
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
  let diff: number | undefined;
  if (stackrabbit.nextBox.length >= 2) diff = stackrabbit.nextBox[0].score - stackrabbit.nextBox[1].score;
  else diff = -1;

  let diffNNB: number | undefined;
  if (stackrabbit.noNextBox.length >= 2) diffNNB = stackrabbit.noNextBox[0].score - stackrabbit.noNextBox[1].score;
  else diffNNB = undefined;


  const details: PuzzleRatingDetails = {bestNB, diff, isAdjustment,
     rating: PuzzleRating.UNRATED,
     hasBurn: hasAnyBurn,
      hasTuckOrSpin: hasAnyTuckOrSpin
  };

  if (diff === undefined || diffNNB === undefined) return {rating: PuzzleRating.BAD_PUZZLE, details, badReason : "Diff undefined"};

  // if diff is too small, zero, or negative, return BAD_PUZZLE
  if (diff <= 1.5) return {rating: PuzzleRating.BAD_PUZZLE, details, badReason : "Diff too small"};

  // if bestNB is too low, return BAD_PUZZLE
  if (bestNB < 0) return {rating: PuzzleRating.BAD_PUZZLE, details, badReason : "BestNB too low"};

  // eliminate puzzles where the first placement is I-0
  if (stackrabbit.nextBox[0].firstPlacement.getTetrisNotation() === "I-0") {
    return {rating: PuzzleRating.BAD_PUZZLE, details, badReason : "First placement is I-0"};
  }

  // eliminate puzzles where the second placement is I-0
  if (stackrabbit.nextBox[0].secondPlacement.getTetrisNotation() === "I-0") {
    return {rating: PuzzleRating.BAD_PUZZLE, details, badReason : "Second placement is I-0"};
  }

  // Eliminate puzzles where 20hz SR disagrees with 30hz SR
  const stackrabbit20hz = await getStackrabbitResponse(board, current, next, InputSpeed.HZ_15);
  if (stackrabbit20hz.nextBox.length === 0) return {rating: PuzzleRating.BAD_PUZZLE, details};
  if (!(
    stackrabbit.nextBox[0].firstPlacement.equals(stackrabbit20hz.nextBox[0].firstPlacement) &&
    stackrabbit.nextBox[0].secondPlacement.equals(stackrabbit20hz.nextBox[0].secondPlacement)
  )) return {rating: PuzzleRating.BAD_PUZZLE, details, badReason : "20hz SR disagrees with 30hz SR"};

  let rating: PuzzleRating;
  if (diff >= 30 && !isAdjustment && !hasAnyBurn && !hasAnyTuckOrSpin && diffNNB >= 10) rating = PuzzleRating.ONE_STAR;
  else if (diff >= 15 && !hasAnyTuckOrSpin && !isAdjustment) rating = PuzzleRating.TWO_STAR;
  else if (diff >= 6) rating = PuzzleRating.THREE_STAR;
  else {
    // at this point, the puzzle is 3-5 star. Use a nerfed version of SR to categorize
    // use a nerfed version of SR to determine if the puzzle is 4 or 5 star
    
    try {
      const babyrabbit = await getStackrabbitResponse(board, current, next, InputSpeed.HZ_30, 7, 1);

      // find the index of the best move in the babyrabbit response
      const babyRabbitIndex = babyrabbit.nextBox.findIndex(move => (
        move.firstPlacement.equals(stackrabbit.nextBox[0].firstPlacement)
        && move.secondPlacement.equals(stackrabbit.nextBox[0].secondPlacement)
      ));

      // if the best move is not in the baby rabbit response, or babyrabbit thinks the best move is worse by at least 2, then the puzzle is hard
      const hard = (babyRabbitIndex === -1) || (babyrabbit.nextBox[0].score - babyrabbit.nextBox[babyRabbitIndex].score >= 3);

      // If hard flag is set, bump the rating difficulty
      if (diff >= 4) rating = hard ? PuzzleRating.FOUR_STAR : PuzzleRating.THREE_STAR;
      else rating = hard ? PuzzleRating.FIVE_STAR : (diff >= 2.5 ? PuzzleRating.THREE_STAR : PuzzleRating.FOUR_STAR);

    } catch {
      return {rating: PuzzleRating.BAD_PUZZLE, details, badReason : "Error in babyrabbit"};
    }
  }

  if (rating <= PuzzleRating.TWO_STAR && bestNB < 10) return {rating: PuzzleRating.BAD_PUZZLE, details, badReason : "BestNB too low for 1-2 star puzzles"};

  // If the any move within some elo of best move is opposite burn/no-burn status as best move, return BAD_PUZZLE due to burn/no-burn deciding factor
  const BURN_ELO_DIFF = (rating <= PuzzleRating.THREE_STAR) ? 15 : 5;
  for (let i = 1; i < stackrabbit.nextBox.length; i++) {

    // If diff is greater than 5, then we can stop checking
    if (bestNB - stackrabbit.nextBox[i].score > BURN_ELO_DIFF) break;

    // Get the board after first move
    const boardAfter = board.copy();
    stackrabbit.nextBox[i].firstPlacement.blitToBoard(boardAfter);
    boardAfter.processLineClears();

    // Get the burn status of the moves
    const hasBurnMove = hasBurn(board, stackrabbit.nextBox[i].firstPlacement) || hasBurn(boardAfter, stackrabbit.nextBox[i].secondPlacement);

    // If the burn status is different, return BAD_PUZZLE
    if (hasAnyBurn !== hasBurnMove) {
      return {rating: PuzzleRating.BAD_PUZZLE, details, badReason : "Burn/no-burn deciding factor"};
    }
  }

  // the puzzle solution
  const currentSolution = stackrabbit.nextBox[0].firstPlacement;
  const nextSolution = stackrabbit.nextBox[0].secondPlacement;

  // return the rating with details and solution
  details.rating = rating;
  return {rating, details, currentSolution, nextSolution};
}