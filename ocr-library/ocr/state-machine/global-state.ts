import { PacketSender } from "../util/packet-sender";
import { DEFAULT_POLLED_GAME_DATA, GameDisplayData } from "../../shared/tetris/game-display-data";
import { GameAbbrBoardPacket, GameFullBoardPacket, GamePlacementPacket, GameStartPacket } from "../../shared/network/stream-packets/packet";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { TetrisBoard } from "../../shared/tetris/tetris-board";
import MoveableTetromino from "../../shared/tetris/moveable-tetromino";
import { SmartGameStatus } from "../../shared/tetris/smart-game-status";
import GameStatus, { IGameStatus } from "../../shared/tetris/game-status";
import { LogType, TextLogger } from "./state-machine-logger";

/**
 * Stores the state global to the state machine, and sends packets to the injected PacketSender on changes.
 */
export class GlobalState {

    public game?: GameState;

    constructor(
        private readonly packetSender: PacketSender
    ) {}

    startGame(level: number, current: TetrominoType, next: TetrominoType): void {
        this.game = new GameState(this.packetSender, level, current, next);
        this.packetSender.bufferPacket(new GameStartPacket().toBinaryEncoder({level, current, next}));
    }

    getGameDisplayData(): GameDisplayData {
        return this.game?.getDisplayData() ?? DEFAULT_POLLED_GAME_DATA;
    }

}

/**
 * Stores the state global to the state machine for the current game.
 */
export class GameState {

    /**
     * Represents the board without either the falling piece or the previously-placed piece. At the
     * start of the game, this is the empty board.
     */
    private stableBoard = new TetrisBoard();
    private stableBoardCount = 0;

    private status: SmartGameStatus;

    // Computed display board this frame
    private displayBoard = new TetrisBoard();

    constructor(
        private readonly packetSender: PacketSender,
        public readonly startLevel: number,
        private currentType: TetrominoType,
        private nextType: TetrominoType
    ) {
        this.status = new SmartGameStatus(startLevel);
    }

    getStableBoard(): TetrisBoard {
        return this.stableBoard;
    }

    getStableBoardCount(): number {
        return this.stableBoardCount;
    }

    getCurrentType(): TetrominoType {
        return this.currentType;
    }

    getNextType(): TetrominoType {
        return this.nextType;
    }

    getStatus(): GameStatus {
        return this.status.status;
    }

    placePiece(mt: MoveableTetromino, nextType: TetrominoType, logger: TextLogger) {

        // Place the piece on the stable board and process line clears
        mt.blitToBoard(this.stableBoard);
        const linesCleared = this.stableBoard.processLineClears();
        this.status.onLineClear(linesCleared);
        this.stableBoardCount = this.stableBoard.count();

        if (linesCleared > 0) {
            logger.log(LogType.INFO, `${linesCleared} lines cleared. New score: ${this.status.score} at ${this.status.lines} lines, level ${this.status.level}`);
        }

        // Shift the next piece
        this.currentType = this.nextType;
        this.nextType = nextType;

        // Send the game placement packet
        this.packetSender.bufferPacket(new GamePlacementPacket().toBinaryEncoder({
            delta: 0, // TODO
            nextNextType: nextType,
            mtPose: mt.getMTPose(),
            pushdown: 0, // TODO
        }));
    }

    /**
     * Sent on frames where the active piece cannot be derived, so we set the display board to the ocr board
     * directly and send a packet with the full board
     * @param board The full color board for this frame
     */
    setFullBoard(board: TetrisBoard) {

        // Duplicate board, do not need to resend
        if (this.displayBoard.equals(board)) return;

        this.displayBoard = board;
        this.packetSender.bufferPacket(new GameFullBoardPacket().toBinaryEncoder({
            delta: 0,
            board: board
        }));
    }

    /**
     * Sent on frames where the active piece is known, so we can compute the display board from just the stable
     * board and active piece, and also just send the active piece in an abbreviated packet
     * @param activePiece The active piece on the current board for this frame
     */
    setAbbreviatedBoard(activePiece: MoveableTetromino) {
        // Set display board to the active piece on the stable board
        const newDisplayBoard = this.stableBoard.copy();
        activePiece.blitToBoard(newDisplayBoard);

        // Duplicate board, do not need to resend
        if (this.displayBoard.equals(newDisplayBoard)) return;

        this.displayBoard = newDisplayBoard;

        // Send the abbreviated packet
        this.packetSender.bufferPacket(new GameAbbrBoardPacket().toBinaryEncoder({
            delta: 0,
            mtPose: activePiece.getMTPose()
        }));
    }

    getDisplayData(): GameDisplayData {
        return {
            board: this.displayBoard,
            nextPiece: this.nextType,
            level: this.status.level,
            lines: this.status.lines,
            score: this.status.score,
            countdown: 0,
        }
    }

}