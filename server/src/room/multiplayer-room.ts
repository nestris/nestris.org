
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { RoomType } from "../../shared/room/room-models";
import { Room } from "../online-users/event-consumers/room-consumer";
import { OnlineUserActivityType, UserSessionID } from "../online-users/online-user";
import { MultiplayerRoomState } from "../../shared/room/multiplayer-room-models";
import { GamePlayer } from "./game-player";

export class MultiplayerRoom extends Room<MultiplayerRoomState> {

    // The two players in the room
    private gamePlayers: [GamePlayer, GamePlayer];

    /**
     * Creates a new SoloRoom for the single player with the given playerSessionID
     * @param playerSessionID The playerSessionID of the player in the room
     */
    constructor(player1SessionID: UserSessionID, player2SessionID: UserSessionID) {
        super(
            OnlineUserActivityType.MULTIPLAYER,
            [player1SessionID, player2SessionID],
            { type: RoomType.MULTIPLAYER },
        )

        // Create the players in the room
        this.gamePlayers = [player1SessionID, player2SessionID].map(playerSessionID => {
            const username = MultiplayerRoom.Users.getUserInfo(playerSessionID.userid)!.username;
            return new GamePlayer(MultiplayerRoom.Users, playerSessionID.userid, username, playerSessionID.sessionID);
        }) as [GamePlayer, GamePlayer];
    }

    /**
     * Handle binary message from the player in the room
     * @param sessionID The sessionID of the player
     * @param message The binary message from the player
     */
    protected async onPlayerSendBinaryMessage(sessionID: string, message: PacketDisassembler): Promise<void> {

        // Get the corresponding player
        const player = this.gamePlayers.find(player => player.sessionID === sessionID);
        if (!player) throw new Error(`Player with sessionID ${sessionID} not found in room`);

        // Resend message to all other players in the room
        this.sendToAllExcept(sessionID, message.stream);

        // Handle each packet individually
        while (message.hasMorePackets()) {
            const packet = message.nextPacket();
            await player.handlePacket(packet);
        }
    }

    /**
     * Cleanup logic for all players in the room when the room is about to be deleted
     */
    protected override async onDelete(): Promise<void> {        
        await Promise.all(this.gamePlayers.map(player => player.onDelete()));
    }
}