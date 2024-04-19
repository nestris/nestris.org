import MoveableTetromino from "../../network-protocol/tetris/moveable-tetromino";
import { TetrisBoard } from "../../network-protocol/tetris/tetris-board";
import { PuzzleTheme } from "../../network-protocol/puzzles/puzzle-theme";
import { PuzzleRatingDetails } from "network-protocol/puzzles/puzzle-rating";

function isDig(board: TetrisBoard): boolean {

  // if there is at least two minos on the right column, it is a dig
  let rightCount = 0;
  for (let i = 0; i < 20; i++) {
    if (board.getAt(9, i)) {
      rightCount++;
    }
  }
  return rightCount >= 2;
}

function getColumnHeight(board: TetrisBoard, column: number): number {
  for (let i = 0; i < 20; i++) {
    if (board.getAt(column, i)) {
      return 20 - i;
    }
  }
  return 0;
}

function isSpire(board: TetrisBoard): boolean {

  // when the average height of two adjacent columns is at least 4 greater than the columns on both sides, it is a spire
  for (let i = 0; i < 7; i++) {
    const leftHeight = getColumnHeight(board, i);
    const rightHeight = getColumnHeight(board, i + 3);
    const middleHeight = (getColumnHeight(board, i + 1) + getColumnHeight(board, i + 2)) / 2;
    if (middleHeight >= leftHeight + 4 && middleHeight >= rightHeight + 4) {
      return true;
    }
  }
  return false;
}


export function classifyPuzzleTheme(
  board: TetrisBoard,
  currentPlacement: MoveableTetromino,
  nextPlacement: MoveableTetromino,
  details: PuzzleRatingDetails
): PuzzleTheme {

  if (isDig(board)) return PuzzleTheme.DIG;
  if (isSpire(board)) return PuzzleTheme.SPIRE;
  if (details.hasBurn) return PuzzleTheme.BURN;
  if (details.hasTuckOrSpin) return PuzzleTheme.OVERHANG;
  return PuzzleTheme.CLEAN;
}