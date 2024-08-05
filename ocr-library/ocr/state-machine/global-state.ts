import { PacketSender } from "../util/packet-sender";
import { DEFAULT_POLLED_GAME_DATA, GameDisplayData } from "../../shared/tetris/game-display-data";
import { GameEndPacket, GameStartPacket } from "../../shared/network/stream-packets/packet";
import { TetrominoType } from "../../shared/tetris/tetromino-type";
import { TetrisBoard } from "../../shared/tetris/tetris-board";

/**
 * Stores the state global to the state machine, and sends packets to the injected PacketSender on changes.
 */
export class GlobalState {

    public game?: GameState;

    constructor(
        private readonly packetSender: PacketSender
    ) {}

    startGame(level: number, current: TetrominoType, next: TetrominoType): void {
        this.game = new GameState(level);
        this.packetSender.bufferPacket(new GameStartPacket().toBinaryEncoder({level, current, next}));
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

    constructor(
        public readonly startLevel: number,
    ) {}

    getStableBoard(): TetrisBoard {
        return this.stableBoard;
    }

    getStableBoardCount(): number {
        return this.stableBoardCount;
    }

    setStableBoard(board: TetrisBoard): void {
        this.stableBoard = board;
        this.stableBoardCount = board.count();
    }

}