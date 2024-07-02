import { SmartGameStatus } from "client/src/app/models/scoring/smart-game-status";
import { FullRecoverySchema } from "network-protocol/stream-packets/packet";
import MoveableTetromino from "network-protocol/tetris/moveable-tetromino";
import { TetrisBoard } from "network-protocol/tetris/tetris-board";
import { TetrominoType } from "network-protocol/tetris/tetromino-type";

// Keeps track of state within a legal game
export class GameState {

  // state that changes after each placement
  private status: SmartGameStatus;
  private isolatedBoard: TetrisBoard; // current tetris board without the active piece
  private current: TetrominoType;
  private next: TetrominoType;

  // full board for current frame including active piece
  // updated on fullBoardUpdate and abbreviatedBoardUpdate
  private currentBoard: TetrisBoard; 
  

  constructor(startLevel: number, current: TetrominoType, next: TetrominoType) {
    this.status = new SmartGameStatus(startLevel);
    this.isolatedBoard = new TetrisBoard(); // the board without the active piece. updated every placement
    this.current = current;
    this.next = next;

    this.currentBoard = new TetrisBoard();
  }

  
  getStatus(): SmartGameStatus {
    return this.status;
  }

  getCurrentType(): TetrominoType {
    return this.current;
  }

  getNextType(): TetrominoType {
    return this.next;
  }

  // get current board INCLUDING active piece
  getCurrentBoard(): TetrisBoard {
    return this.currentBoard;
  }

  onRecovery(recovery: FullRecoverySchema) {
    this.status = new SmartGameStatus(recovery.startLevel, recovery.lines, recovery.score, recovery.level);
    this.isolatedBoard = recovery.board;
    this.current = recovery.current;
    this.next = recovery.next;
  }

  // when a packet for the full board recieved. updates current board
  onFullBoardUpdate(board: TetrisBoard) {
    this.currentBoard = board;
  }

  // when a packet for the active piece's location recieved. updates current board by placing active piece on isolated board
  onAbbreviatedBoardUpdate(activePiece: MoveableTetromino) {

    // assert that the active piece can be placed on the board without intersecting existing minos
    // note we are NOT checking for valid placements (active piece can still be in the air)
    if (activePiece.intersectsBoard(this.isolatedBoard)) {
      throw new Error("Active piece overlaps with isolated board");
    }

    this.currentBoard = this.isolatedBoard.copy();
    activePiece.blitToBoard(this.isolatedBoard);
  }

  // called whenever a new piece is placed on the board. Updates board and counters
  // nextNextPiece is the piece in the next box after the piece is placed and the new piece spawns
  // pushdown is the number of pushdown points scored with this placement
  onPlacement(placement: MoveableTetromino, nextNextPiece: TetrominoType, pushdown: number = 0) {

    // assert that placement is valid
    if (!placement.isValidPlacement(this.isolatedBoard)) {
      throw new Error("Placement is not legal on the current board");
    }

    // place piece on board and clear lines
    placement.blitToBoard(this.isolatedBoard);
    const linesCleared = this.isolatedBoard.processLineClears();
    this.status.onLineClear(linesCleared);

    // shift current and next pieces
    this.current = this.next;
    this.next = nextNextPiece;

    // increment pushdown into score, if any
    this.status.onPushdown(pushdown);
  }
}