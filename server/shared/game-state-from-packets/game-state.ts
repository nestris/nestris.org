import { GameFullStateSchema, GameRecoverySchema } from "../network/stream-packets/packet";
import MoveableTetromino, { MTPose } from "../tetris/moveable-tetromino";
import { TetrisBoard } from "../tetris/tetris-board";
import { TetrominoType } from "../tetris/tetromino-type";
import { SmartGameStatus } from "../tetris/smart-game-status";
import { DroughtCounter } from "./drought-counter";
import { MemoryGameStatus } from "../tetris/memory-game-status";

export interface GameStateSnapshotWithoutBoard {
  level: number,
  lines: number,
  score: number,
  next: TetrominoType,
  tetrisRate: number,
  droughtCount: number | null,
  countdown: number | undefined,
  transitionInto19: number | null,
  transitionInto29: number | null,
  numPlacements: number
}

export interface GameStateSnapshot extends GameStateSnapshotWithoutBoard {
  board: TetrisBoard
}

export interface PlacementInfo {
  numLinesCleared: number;

}

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

  private numTetrises: number = 0;
  private numLines: number = 0;
  private numPlacements: number = 0;

  private transitionInto19: number | null = null;
  private transitionInto29: number | null = null;

  private droughtCounter = new DroughtCounter();

  private limbo = false;

  constructor(
    public readonly startLevel: number,
    current: TetrominoType,
    next: TetrominoType,
    initialCountdown: number | undefined = undefined,
    private readonly storeMemory: boolean = false
  ) {
    
    this.status = this.storeMemory ? new MemoryGameStatus(true, startLevel) : new SmartGameStatus(startLevel);
    
    this.isolatedBoard = new TetrisBoard(); // the board without the active piece. updated every placement
    this.current = current;
    this.next = next;

    this.currentBoard = new TetrisBoard();
    this.countdown = initialCountdown;
    this.droughtCounter.onPiece(current);
  }

  static fromRecovery(recovery: GameRecoverySchema, storeMemory: boolean = false): GameState {
    const state = new GameState(recovery.startLevel, recovery.current, recovery.next, undefined, storeMemory);
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

  getIsolatedBoard(): TetrisBoard {
    return this.isolatedBoard;
  }

  getCountdown(): number | undefined {
    return this.countdown;
  }

  getNumTetrises(): number {
    return this.numTetrises;
  }

  getNumPlacements(): number {
    return this.numPlacements;
  }

  // Get what percentage of lines cleared were tetrises
  getTetrisRate(): number {
    return this.numLines === 0 ? 0 : (this.numTetrises * 4) / this.numLines;
  }

  onFullState(fullState: GameFullStateSchema) {
    this.limbo = true;
    this.currentBoard = fullState.board;
    this.status.setStatus(fullState.level, fullState.lines, fullState.score);
  }

  onRecovery(recovery: GameRecoverySchema) {

    this.status = (
      this.storeMemory
      ? new MemoryGameStatus(true, recovery.startLevel, recovery.lines, recovery.score, recovery.level)
      : new SmartGameStatus(recovery.startLevel, recovery.lines, recovery.score, recovery.level)
    );
    this.isolatedBoard = recovery.isolatedBoard;
    this.current = recovery.current;
    this.next = recovery.next;
    this.countdown = recovery.countdown;
    this.droughtCounter.reset();
    this.droughtCounter.onPiece(this.current);

    this.limbo = false;
  }

  // when a packet for the full board recieved. updates current board
  onFullBoardUpdate(board: TetrisBoard) {
    if (this.limbo) throw new Error("Cannot full board update on limbo");
    this.currentBoard = board;
  }

  // when a packet for the active piece's location recieved. updates current board by placing active piece on isolated board
  onAbbreviatedBoardUpdate(mtPose: MTPose) {
    if (this.limbo) throw new Error("Cannot abbr board update on limbo");

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
  onPlacement(mtPose: MTPose, nextNextPiece: TetrominoType, pushdown: number = 0): PlacementInfo {

    if (nextNextPiece === TetrominoType.ERROR_TYPE) {
      throw new Error("nextNextPiece must be a valid Tetromino type");
    }

    const placement = MoveableTetromino.fromMTPose(this.current, mtPose);

    // assert that placement is valid
    if (!placement.isValidPlacement(this.isolatedBoard)) {
      throw new Error("Placement is not legal on the current board");
    }
    
    const levelBefore = this.status.level;

    // place piece on board and clear lines
    placement.blitToBoard(this.isolatedBoard);
    const linesCleared = this.isolatedBoard.processLineClears();
    this.status.onLineClear(linesCleared);

    // increment tetrises and lines cleared
    this.numLines += linesCleared;
    if (linesCleared === 4) this.numTetrises++;

    // calculate transitions, if any
    if (levelBefore === 18 && this.status.level === 19) {
      this.transitionInto19 = this.status.score;
    }
    if (levelBefore === 28 && this.status.level === 29) {
      this.transitionInto29 = this.status.score;
    }


    // shift current and next pieces
    this.current = this.next;
    this.next = nextNextPiece;

    this.droughtCounter.onPiece(this.current);

    // increment pushdown into score, if any
    this.status.onPushdown(pushdown);

    this.numPlacements++;

    return {
      numLinesCleared: linesCleared
    }
  }

  setCountdown(countdown: number) {
    if (countdown === 0) this.countdown = undefined;
    else this.countdown = countdown;
  }

  // get a snapshot of the current game state
  getSnapshot(): GameStateSnapshot {
    return Object.assign({}, this.getSnapshotWithoutBoard(), { board: this.currentBoard });
  }

  getSnapshotWithoutBoard(): GameStateSnapshotWithoutBoard {
    return {
      level: this.status.level,
      lines: this.status.lines,
      score: this.status.score,
      next: this.next,
      tetrisRate: this.getTetrisRate(),
      droughtCount: this.droughtCounter.getDroughtCount(),
      countdown: this.countdown,
      transitionInto19: this.transitionInto19,
      transitionInto29: this.transitionInto29,
      numPlacements: this.numPlacements
    };
  }
}