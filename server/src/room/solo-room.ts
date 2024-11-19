import { FinishSoloGameMessage } from "../../shared/network/json-message";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { RoomType } from "../../shared/room/room-models";
import { SoloRoomState } from "../../shared/room/solo-room-models";
import { DBSoloGamesListAddEvent, DBSoloGamesListView } from "../database/db-views/db-solo-games-list";
import { Room } from "../online-users/event-consumers/room-consumer";
import { OnlineUserActivityType } from "../online-users/online-user";
import { GameEndEvent, GamePlayer, GameStartEvent } from "./game-player";

export class SoloRoom extends Room<SoloRoomState> {

    private player: GamePlayer;

    /**
     * Creates a new SoloRoom for the single player with the given playerSessionID
     * @param playerSessionID The playerSessionID of the player in the room
     */
    constructor(playerSessionID: string) {
        super(
            OnlineUserActivityType.SOLO,
            [playerSessionID],
            { type: RoomType.SOLO, serverInGame: false },
        )

        const userid = SoloRoom.Users.getUserIDBySessionID(playerSessionID)!;
        const username = SoloRoom.Users.getUserInfo(userid)!.username;

        this.player = new GamePlayer(SoloRoom.Users, userid, username, playerSessionID);
        
        // Handle solo-room-specific behavior when the game starts
        this.player.onGameStart$().subscribe(async (event: GameStartEvent) => {
            this.updateServerInGame(true);
        });

        // Handle solo-room-specific behavior when the game ends
        this.player.onGameEnd$().subscribe(async (event: GameEndEvent) => {

            // Add game to list of solo games
            DBSoloGamesListView.alter(this.player.userid, new DBSoloGamesListAddEvent(event.gameID, event.score, event.xpGained));

            // Send message to all session of player of a new solo game that was finished
            SoloRoom.Users.sendToUser(this.player.userid, new FinishSoloGameMessage(event.gameID, event.score, event.xpGained));

            // Send message to player indicating that the game has ended and server has finished processing
            this.updateServerInGame(false);
        });
    }

    /**
     * Handle binary message from the player in the room
     * @param sessionID The sessionID of the player. We only have one player in a solo room, so don't really care about this.
     * @param message The binary message from the player
     */
    protected async onPlayerSendBinaryMessage(sessionID: string, message: PacketDisassembler): Promise<void> {

        // Resend message to all other players in the room
        this.sendToAllExcept(sessionID, message.stream);

        // Handle each packet individually
        while (message.hasMorePackets()) {
            const packet = message.nextPacket();
            await this.player.handlePacket(packet);
        }
    }

    /**
     * Handle the player leaving the room
     */
    protected override async onDelete(): Promise<void> {
        await this.player.onDelete();
    }

    /**
     * Update the room state to indicate whether the server is in game, and send to client
     * @param serverInGame 
     */
    private updateServerInGame(serverInGame: boolean) {
        this.updateRoomState(Object.assign({}, this.getRoomState(), { serverInGame }));
    }

}