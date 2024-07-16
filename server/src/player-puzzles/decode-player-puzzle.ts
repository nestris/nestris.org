import { BinaryTranscoder } from "../../shared/network/tetris-board-transcoding/binary-transcoder";
import { BufferTranscoder } from "../../shared/network/tetris-board-transcoding/buffer-transcoder";
import { PlayerPuzzle } from "../../shared/puzzles/player-puzzle";
import { TETROMINO_CHAR_TO_TYPE } from "../../shared/tetris/tetrominos";


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
  }

}