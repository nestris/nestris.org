import MoveableTetromino from "../../network-protocol/tetris/moveable-tetromino";
import { TetrisBoard } from "../../network-protocol/tetris/tetris-board";
import { PuzzleTheme } from "../../network-protocol/puzzles/puzzle-theme";

export function classifyPuzzleTheme(board: TetrisBoard, currentPlacement: MoveableTetromino, nextPlacement: MoveableTetromino): PuzzleTheme {
  return PuzzleTheme.CLEAN;
}