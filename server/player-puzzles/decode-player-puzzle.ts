import { PuzzleRating } from "network-protocol/puzzles/puzzle-rating";
import { BinaryTranscoder } from "../../network-protocol/tetris-board-transcoding/binary-transcoder";
import { BufferTranscoder } from "../../network-protocol/tetris-board-transcoding/buffer-transcoder";
import { TetrominoType } from "../../network-protocol/tetris/tetromino-type";
import { TETROMINO_CHAR, TETROMINO_CHAR_TO_TYPE } from "../../network-protocol/tetris/tetrominos";
import { PlayerPuzzle } from "../../network-protocol/puzzles/player-puzzle";


export function decodePlayerPuzzleFromDB(puzzle: any): PlayerPuzzle {

  const board = BinaryTranscoder.encode(BufferTranscoder.decode(puzzle.board));
  const currentPiece = TETROMINO_CHAR_TO_TYPE[puzzle.current_piece];
  const nextPiece = TETROMINO_CHAR_TO_TYPE[puzzle.next_piece];

  return {
    id: puzzle.id,
    creator: puzzle.creator,
    boardString: board,
    current: currentPiece,
    next: nextPiece,
    r1: puzzle.r1,
    x1: puzzle.x1,
    y1: puzzle.y1,
    r2: puzzle.r2,
    x2: puzzle.x2,
    y2: puzzle.y2,
    rating: puzzle.rating,
    numAttempts: puzzle.num_attempts_cached,
    numSolves: puzzle.num_solves_cached
  }

}