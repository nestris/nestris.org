
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { RoomType } from "../../shared/room/room-models";
import { Room } from "../online-users/event-consumers/room-consumer";
import { OnlineUserActivityType, UserSessionID } from "../online-users/online-user";
import { MultiplayerRoomState, MultiplayerRoomStatus, PlayerIndex, PlayerInfo } from "../../shared/room/multiplayer-room-models";
import { GamePlayer } from "./game-player";
import { GymRNG } from "../../shared/tetris/piece-sequence-generation/gym-rng";
import { DBUserObject } from "../database/db-objects/db-user";

export class MultiplayerRoom extends Room<MultiplayerRoomState> {

    // The two players in the room
    private gamePlayers: {[PlayerIndex.PLAYER_1]: GamePlayer, [PlayerIndex.PLAYER_2]: GamePlayer};

    /**
     * Creates a new SoloRoom for the single player with the given playerSessionID
     * @param playerSessionID The playerSessionID of the player in the room
     */
    constructor(player1SessionID: UserSessionID, player2SessionID: UserSessionID) {

        super(
            OnlineUserActivityType.MULTIPLAYER,
            [player1SessionID, player2SessionID],
        )

        // Create the players in the room
        const player1Username = MultiplayerRoom.Users.getUserInfo(player1SessionID.userid)!.username;
        const player2Username = MultiplayerRoom.Users.getUserInfo(player2SessionID.userid)!.username;
        this.gamePlayers = {
            [PlayerIndex.PLAYER_1]: new GamePlayer(MultiplayerRoom.Users, player1SessionID.userid, player1Username, player1SessionID.sessionID),
            [PlayerIndex.PLAYER_2]: new GamePlayer(MultiplayerRoom.Users, player2SessionID.userid, player2Username, player2SessionID.sessionID)
        };
    }

    /**
     * Get the player info for the player at the given index
     * @param playerIndex The index of the player
     * @returns The player info for the player
     */
    private async getInfoForPlayer(playerIndex: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2): Promise<PlayerInfo> {

        const userid = this.gamePlayers[playerIndex].userid;
        const trophies = (await DBUserObject.get(userid)).object.trophies;

        return {
            userid: this.gamePlayers[playerIndex].userid,
            username: this.gamePlayers[playerIndex].username,
            sessionID: this.gamePlayers[playerIndex].sessionID,
            trophies: trophies,
        };
    }

    /**
     * Define the initial state of multiplayer room
     */
    protected override async initRoomState(): Promise<MultiplayerRoomState> {

        return {
            type: RoomType.MULTIPLAYER,
            startLevel: 18,
            ranked: true,
            winningScore: 2,
            players: {
                [PlayerIndex.PLAYER_1]: await this.getInfoForPlayer(PlayerIndex.PLAYER_1),
                [PlayerIndex.PLAYER_2]: await this.getInfoForPlayer(PlayerIndex.PLAYER_2),
            },

            points: [],
            currentSeed: GymRNG.generateRandomSeed(),
            matchWinner: null,
            wonByResignation: false,
            ready: { [PlayerIndex.PLAYER_1]: false, [PlayerIndex.PLAYER_2]: false },
            status: MultiplayerRoomStatus.BEFORE_GAME,
        };
    }

    /**
     * Given a sessionID, return the player index of the player in the room
     * @param sessionID The sessionID of the player
     * @returns The player index of the player
     * @throws Error if the player is not in the room
     */
    private getPlayerIndex(sessionID: string): PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2 {
        if (this.gamePlayers[PlayerIndex.PLAYER_1].sessionID === sessionID) {
            return PlayerIndex.PLAYER_1;
        } else if (this.gamePlayers[PlayerIndex.PLAYER_2].sessionID === sessionID) {
            return PlayerIndex.PLAYER_2;
        } else {
            throw new Error(`Player with sessionID ${sessionID} not found in room`);
        }
    }

    /**
     * Handle binary message from the player in the room
     * @param sessionID The sessionID of the player
     * @param message The binary message from the player
     */
    protected async onPlayerSendBinaryMessage(sessionID: string, message: PacketDisassembler): Promise<void> {

        // Get the corresponding player
        const playerIndex = this.getPlayerIndex(sessionID);
        const player = this.gamePlayers[playerIndex];

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
        await Promise.all(Object.values(this.gamePlayers).map(player => player.onDelete()));
    }
}