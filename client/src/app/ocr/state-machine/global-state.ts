import { PacketSender } from "../util/packet-sender";
import { DEFAULT_POLLED_GAME_DATA, GameDisplayData } from "../../shared/tetris/game-display-data";
import { GameEndPacket, GamePlacementPacket, GameStartPacket } from "../../shared/network/stream-packets/packet";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { TetrisBoard } from "../../shared/tetris/tetris-board";
import MoveableTetromino from "../../shared/tetris/moveable-tetromino";
import { SmartGameStatus } from "../../shared/tetris/smart-game-status";

/**
 * Stores the state global to the state machine, and sends packets to the injected PacketSender on changes.
 */
export class GlobalState {

    public game?: GameState;

    constructor(
        private readonly packetSender: PacketSender
    ) {}

    startGame(level: number, current: TetrominoType, next: TetrominoType): void {
        this.game = new GameState(level, current, next);
        this.packetSender.bufferPacket(new GameStartPacket().toBinaryEncoder({level, current, next}));
    }

    placePiece(mt: MoveableTetromino, nextType: TetrominoType) {
        if (this.game === undefined) throw new Error("Game must be defined in GlobalState");
        this.game.placePiece(mt, nextType);
        this.packetSender.bufferPacket(new GamePlacementPacket().toBinaryEncoder({
            delta: 0, // TODO
            nextNextType: nextType,
            mtPose: mt.getMTPose(),
            pushdown: 0, // TODO
        }));
    }


    getGameDisplayData(): GameDisplayData {
        return DEFAULT_POLLED_GAME_DATA;
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

    constructor(
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

    placePiece(mt: MoveableTetromino, nextType: TetrominoType) {

        // Place the piece on the stable board and process line clears
        mt.blitToBoard(this.stableBoard);
        const linesCleared = this.stableBoard.processLineClears();
        this.status.onLineClear(linesCleared);
        this.stableBoardCount = this.stableBoard.count();

        // Shift the next piece
        this.currentType = this.nextType;
        this.nextType = nextType;
    }

}