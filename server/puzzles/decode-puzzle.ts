import { BinaryTranscoder } from "../../network-protocol/tetris-board-transcoding/binary-transcoder";
import { BufferTranscoder } from "../../network-protocol/tetris-board-transcoding/buffer-transcoder";
import { TetrominoType } from "../../network-protocol/tetris/tetromino-type";
import { TETROMINO_CHAR, TETROMINO_CHAR_TO_TYPE } from "../../network-protocol/tetris/tetrominos";

export interface SerializedPuzzle {
  id: string;
  creator: string;
  board: string;
  currentPiece: TetrominoType;
  nextPiece: TetrominoType;
  r1: number;
  x1: number;
  y1: number;
  r2: number;
  x2: number;
  y2: number;
  elo: number;
  numReports: number;
  numAttempts: number;
  numSolves: number;
}

export function decodePuzzleFromDB(puzzle: any): SerializedPuzzle {

  const board = BinaryTranscoder.encode(BufferTranscoder.decode(puzzle.board));
  const currentPiece = TETROMINO_CHAR_TO_TYPE[puzzle.current_piece];
  const nextPiece = TETROMINO_CHAR_TO_TYPE[puzzle.next_piece];

  return {
    id: puzzle.id,
    creator: puzzle.creator,
    board: board,
    currentPiece: currentPiece,
    nextPiece: nextPiece,
    r1: puzzle.r1,
    x1: puzzle.x1,
    y1: puzzle.y1,
    r2: puzzle.r2,
    x2: puzzle.x2,
    y2: puzzle.y2,
    elo: puzzle.elo,
    numReports: puzzle.num_reports,
    numAttempts: puzzle.num_attempts_cached,
    numSolves: puzzle.num_solves_cached
  }

}