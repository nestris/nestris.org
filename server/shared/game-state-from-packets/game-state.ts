import { GameRecoverySchema } from "../network/stream-packets/packet";
import MoveableTetromino, { MTPose } from "../tetris/moveable-tetromino";
import { TetrisBoard } from "../tetris/tetris-board";
import { TetrominoType } from "../tetris/tetromino-type";
import { SmartGameStatus } from "../tetris/smart-game-status";

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
  private countdown: number | undefined;

  constructor(startLevel: number, current: TetrominoType, next: TetrominoType) {
    this.status = new SmartGameStatus(startLevel);
    this.isolatedBoard = new TetrisBoard(); // the board without the active piece. updated every placement
    this.current = current;
    this.next = next;

    this.currentBoard = new TetrisBoard();
    this.countdown = undefined;
  }

  static fromRecovery(recovery: GameRecoverySchema): GameState {
    const state = new GameState(recovery.startLevel, recovery.current, recovery.next);
    state.onRecovery(recovery);
    return state;
  }

  generateRecoveryPacket(): GameRecoverySchema {

    return {
      startLevel: this.status.startLevel,
      lines: this.status.lines,
      score: this.status.score,
      level: this.status.level,
      isolatedBoard: this.isolatedBoard,
      current: this.current,
      next: this.next,
      countdown: 0, // countdown is not saved in recovery
    };

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

  getCountdown(): number | undefined {
    return this.countdown;
  }

  onRecovery(recovery: GameRecoverySchema) {
    this.status = new SmartGameStatus(recovery.startLevel, recovery.lines, recovery.score, recovery.level);
    this.isolatedBoard = recovery.isolatedBoard;
    this.current = recovery.current;
    this.next = recovery.next;
    this.countdown = recovery.countdown;
  }

  // when a packet for the full board recieved. updates current board
  onFullBoardUpdate(board: TetrisBoard) {
    this.currentBoard = board;
  }

  // when a packet for the active piece's location recieved. updates current board by placing active piece on isolated board
  onAbbreviatedBoardUpdate(mtPose: MTPose) {

    const piece = MoveableTetromino.fromMTPose(this.current, mtPose);

    // send warning if piece intersects board, as this should not happen
    if (piece.intersectsBoard(this.isolatedBoard)) {
      console.error("Active piece intersects board");
    }

    this.currentBoard = this.isolatedBoard.copy();
    piece.blitToBoard(this.currentBoard);
  }

  // called whenever a new piece is placed on the board. Updates board and counters
  // nextNextPiece is the piece in the next box after the piece is placed and the new piece spawns
  // pushdown is the number of pushdown points scored with this placement
  onPlacement(mtPose: MTPose, nextNextPiece: TetrominoType, pushdown: number = 0) {

    const placement = MoveableTetromino.fromMTPose(this.current, mtPose);

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

  setCountdown(countdown: number) {
    if (countdown === 0) this.countdown = undefined;
    else this.countdown = countdown;
  }
}