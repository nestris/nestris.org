import { OnlineUserActivityType } from "../../shared/models/activity";
import { PacketAssembler } from "../../shared/network/stream-packets/packet-assembler";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { RoomType } from "../../shared/room/room-models";
import { SoloRoomState } from "../../shared/room/solo-room-models";
import { DBSoloGamesListAddEvent, DBSoloGamesListView } from "../database/db-views/db-solo-games-list";
import { Room } from "../online-users/event-consumers/room-consumer";
import { UserSessionID } from "../online-users/online-user";
import { GameEndEvent, GamePlayer, GameStartEvent, XPStrategy } from "./game-player";

/**
 * Strategy for calculating XP gained for a solo game
 * @param score 
 * @returns 
 */
const soloXPStrategy: XPStrategy = (score: number) => {
    // https://www.desmos.com/calculator/g5tyne6y40
    return Math.round(Math.pow(score / 25000, 1.6));
};

export class SoloRoom extends Room<SoloRoomState> {

    private player: GamePlayer;

    /**
     * Creates a new SoloRoom for the single player with the given playerSessionID
     * @param playerSessionID The playerSessionID of the player in the room
     */
    constructor(playerSessionID: UserSessionID) {
        super(
            OnlineUserActivityType.SOLO,
            [playerSessionID],
        )

        const username = SoloRoom.Users.getUserInfo(playerSessionID.userid)!.username;

        this.player = new GamePlayer(SoloRoom.Users, playerSessionID.userid, username, playerSessionID.sessionID, soloXPStrategy);
        
        // Handle solo-room-specific behavior when the game starts
        this.player.onGameStart$().subscribe(async (event: GameStartEvent) => {

            // Send message to player indicating that the game has started
            this.updateRoomState(Object.assign({}, this.getRoomState(), { serverInGame: true }));
        });

        // Handle solo-room-specific behavior when the game ends
        this.player.onGameEnd$().subscribe(async (event: GameEndEvent) => {

            const score = event.state.getStatus().score;

            // Add game to list of solo games
            DBSoloGamesListView.alter(this.player.userid, new DBSoloGamesListAddEvent(event.gameID, score, event.xpGained));

            // Send message to player indicating that the game has ended, with updated previous games
            const updatedPreviousGames = (await DBSoloGamesListView.get(this.player.userid)).view;
            this.updateRoomState({
                type: RoomType.SOLO,
                serverInGame: false,
                previousGames: updatedPreviousGames,
                lastGameSummary: {
                    gameID: event.gameID,
                    score: score,
                    isPersonalBest: event.isPersonalBest,
                    linesCleared: event.state.getStatus().lines,
                    tetrisCount: event.state.getNumTetrises(),
                    accuracy: event.accuracy,
                }
            });
        });
    }

    /**
     * Define the initial state of solo room
     */
    protected override async initRoomState(): Promise<SoloRoomState> {
        const previousGames = (await DBSoloGamesListView.get(this.player.userid)).view;
        return { type: RoomType.SOLO, serverInGame: false, previousGames, lastGameSummary: null };
    }

    /**
     * Handle binary message from the player in the room
     * @param sessionID The sessionID of the player. We only have one player in a solo room, so don't really care about this.
     * @param message The binary message from the player
     */
    protected async onPlayerSendBinaryMessage(sessionID: string, message: PacketDisassembler): Promise<void> {

        // Resend message to all other players in the room
        this.sendToAllExcept(sessionID, PacketAssembler.encodeIndexFromPacketDisassembler(message, 0));

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
}