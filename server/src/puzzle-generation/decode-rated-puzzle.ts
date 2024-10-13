import { BinaryDecoder } from "../../shared/network/binary-codec";
import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { decodePuzzle } from "../../shared/puzzles/encode-puzzle";
import { RatedPuzzle } from "../../shared/puzzles/rated-puzzle";
import MoveableTetromino from "../../shared/tetris/moveable-tetromino";
import { TETROMINO_CHAR_TO_TYPE } from "../../shared/tetris/tetrominos";


export function decodeRatedPuzzleFromDB(puzzle: any): RatedPuzzle {

  const decodedPuzzle = decodePuzzle(puzzle.id)
  const currentPiece = TETROMINO_CHAR_TO_TYPE[puzzle.current_piece];
  const nextPiece = TETROMINO_CHAR_TO_TYPE[puzzle.next_piece];

  if (decodedPuzzle.current !== currentPiece || decodedPuzzle.next !== nextPiece) {
    throw new Error("Decoded puzzle does not match database puzzle");
  }

  const boardString = BinaryTranscoder.encode(decodedPuzzle.board);
  const currentPlacement = MoveableTetromino.fromInt2(puzzle.current_placement);
  const nextPlacement = MoveableTetromino.fromInt2(puzzle.next_placement);

  return {
    id: puzzle.id,
    boardString: boardString,
    current: currentPiece,
    next: nextPiece,
    r1: currentPlacement.getRotation(),
    x1: currentPlacement.getTranslateX(),
    y1: currentPlacement.getTranslateY(),
    r2: nextPlacement.getRotation(),
    x2: nextPlacement.getTranslateX(),
    y2: nextPlacement.getTranslateY(),
    rating: puzzle.rating,
    theme: puzzle.theme,
    numAttempts: puzzle.num_attempts_cached,
    numSolves: puzzle.num_solves_cached,
    likes: puzzle.num_likes_cached,
    dislikes: puzzle.num_dislikes_cached,
    state: puzzle.state,
  }

}