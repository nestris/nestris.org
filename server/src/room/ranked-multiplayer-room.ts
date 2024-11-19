
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { RoomType } from "../../shared/room/room-models";
import { Room } from "../online-users/event-consumers/room-consumer";
import { OnlineUserActivityType } from "../online-users/online-user";
import { MultiplayerRoomState, XPDelta } from "../../shared/room/multiplayer-room-models";
import { GamePlayer } from "./game-player";
import { MultiplayerRoom } from "./multiplayer-room";

export class RankedMultiplayerRoom extends MultiplayerRoom {

    constructor(
        player1SessionID: string,
        player2SessionID: string,
        private readonly player1XPDelta: XPDelta, // How much player 1 will gain/lose
        private readonly player2XPDelta: XPDelta, // How much player 2 will gain/lose
    ) {
        super(player1SessionID, player2SessionID)

    }

}