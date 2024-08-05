import { PacketSender } from "ocr/util/packet-sender";
import { DEFAULT_POLLED_GAME_DATA, GameDisplayData } from "../../shared/tetris/game-display-data";
import { GameEndPacket, GameStartPacket } from "../../shared/network/stream-packets/packet";
import { TetrominoType } from "shared/tetris/tetromino-type";

/**
 * Stores all the data for the current game, and on changes sends packets to the injected PacketSender.
 */
export class GameData {

    constructor(
        private readonly packetSender: PacketSender
    ) {}

    startGame(level: number, current: TetrominoType, next: TetrominoType): void {
        this.packetSender.bufferPacket(new GameStartPacket().toBinaryEncoder({level, current, next}));
    }


    getGameDisplayData(): GameDisplayData {
        return DEFAULT_POLLED_GAME_DATA;
    }

}