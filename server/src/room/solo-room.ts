import { GameState } from "../../shared/game-state-from-packets/game-state";
import { QuestDefinitions } from "../../shared/nestris-org/quest-system";
import { FinishSoloGameMessage, MeMessage, XPGainMessage } from "../../shared/network/json-message";
import { GamePlacementSchema, GameStartSchema, PacketContent, PacketOpcode } from "../../shared/network/stream-packets/packet";
import { PacketAssembler } from "../../shared/network/stream-packets/packet-assembler";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { RoomType } from "../../shared/room/room-models";
import { SoloRoomState } from "../../shared/room/solo-room-models";
import { DBOnGameEndEvent, DBUserObject } from "../database/db-objects/db-user";
import { CreateGameQuery } from "../database/db-queries/create-game-query";
import { Database } from "../database/db-query";
import { DBSoloGamesListAddEvent, DBSoloGamesListView } from "../database/db-views/db-solo-games-list";
import { Room } from "../online-users/event-consumers/room-consumer";
import { v4 as uuid } from 'uuid';

export class SoloRoom extends Room<SoloRoomState> {

    // The current game state of the player in the room
    private gameState: GameState | null = null;
    
    // The aggregation of packets for the current game
    private packets: PacketAssembler = new PacketAssembler();

    private userid: string;
    private username: string;
    private sessionID: string;

    /**
     * Creates a new SoloRoom for the single player with the given playerSessionID
     * @param playerSessionID The playerSessionID of the player in the room
     */
    constructor(playerSessionID: string) {
        super(
            [playerSessionID],
            { type: RoomType.SOLO, serverInGame: false },
        )

        this.sessionID = playerSessionID;
        this.userid = SoloRoom.Users.getUserIDBySessionID(playerSessionID)!;
        this.username = SoloRoom.Users.getUserInfo(this.userid)!.username;
    }

    /**
     * Handle binary message from the player in the room
     * @param sessionID The sessionID of the player. We only have one player in a solo room, so don't really care about this.
     * @param message The binary message from the player
     */
    protected async onPlayerSendBinaryMessage(sessionID: string, message: PacketDisassembler): Promise<void> {

        // Handle each packet individually
        while (message.hasMorePackets()) {
            const packet = message.nextPacket();
            await this.handlePacket(packet);
        }
    }

    /**
     * Handle the player leaving the room
     */
    protected override async onDelete(): Promise<void> {
        
        // If in the middle of a game, handle ending the game and saving the game state
        if (this.gameState) {
            await this.onGameEnd(this.packets, this.gameState);
        }
    }

    /**
     * Update the room state to indicate whether the server is in game, and send to client
     * @param serverInGame 
     */
    private updateServerInGame(serverInGame: boolean) {
        this.updateRoomState(Object.assign({}, this.getRoomState(), { serverInGame }));
    }

    private async handlePacket(packet: PacketContent) {

        // Add packet to the aggregation
        this.packets.addPacketContent(packet.binary);

        // Process packet and update game state
        if (packet.opcode === PacketOpcode.GAME_START) {

            console.log(`Received game start packet from player ${this.username}`);
            const gameStart = (packet.content as GameStartSchema);
            this.gameState = new GameState(gameStart.level, gameStart.current, gameStart.next);

            // Update room state to indicate that the server is now in game
            this.updateServerInGame(true);

        } else if (packet.opcode === PacketOpcode.GAME_PLACEMENT) {
            if (!this.gameState) throw new Error("Cannot add game placement packet without game start packet");
            const gamePlacement = (packet.content as GamePlacementSchema);
            this.gameState.onPlacement(gamePlacement.mtPose, gamePlacement.nextNextType, gamePlacement.pushdown);
            console.log(`Player ${this.username} now has score: ${this.gameState.getStatus().score}`);
        }

        else if (packet.opcode === PacketOpcode.GAME_END) {
            console.log(`Received game end packet from player ${this.username}`);

            // Handle the end of the game
            await this.onGameEnd(this.packets, this.gameState!);

            // Send message to player indicating that the game has ended and server has finished processing
            this.updateServerInGame(false);

            this.gameState = null;
            this.packets = new PacketAssembler();
        }
    }

    /**
     * Handle the end of the game, writing the game state to the database and updating XP/quests
     * @param packets The aggregation of packets for the game
     * @param gameState The final game state of the player
     */
    private async onGameEnd(packets: PacketAssembler, gameState: GameState) {

        const gameID = uuid();

        const state = gameState.getSnapshot();
        const xpGained = 0; // TODO: calculate XP gained

        // Write game to database
        await Database.query(CreateGameQuery, {
            id: gameID,
            userid: this.userid,
            start_level: gameState.startLevel,
            end_level: state.level,
            end_score: state.score,
            end_lines: state.lines,
            accuracy: null, // TODO: calculate accuracy
            tetris_rate: state.tetrisRate,
            xp_gained: xpGained // TODO: calculate XP gained
        });

        // Add game to list of solo games
        DBSoloGamesListView.alter(this.userid, new DBSoloGamesListAddEvent(gameID, state.score, xpGained));

        // get user before updating stats
        const dbUserBefore = (await DBUserObject.get(this.userid)).object;

        // Update user stats from game
        await DBUserObject.alter(this.userid, new DBOnGameEndEvent(
            state.score,
            state.level,
            state.lines,
            state.transitionInto19,
            state.transitionInto29,
            state.perfectInto19,
            state.perfectInto29
        ), false);

        // get user after updating stats
        const dbUserAfter = (await DBUserObject.get(this.userid)).object;

        // Update the new user stats for each session of the player
        SoloRoom.Users.sendToUser(this.userid, new MeMessage(dbUserAfter));

        // Get the list of quest names that were just completed
        const completedQuests = QuestDefinitions.getJustCompletedQuests(dbUserBefore, dbUserAfter).map(q => q.name);

        // Send the XP gained message, as well as any quests completed, to the specific session of the player that finished the game
        SoloRoom.Users.sendToUserSession(this.sessionID, new XPGainMessage(
            dbUserBefore.league,
            dbUserBefore.xp,
            xpGained,
            completedQuests
        ));

        // Send message to all session of player of a new solo game that was finished
        SoloRoom.Users.sendToUser(this.userid, new FinishSoloGameMessage(gameID, state.score, xpGained));

        // TODO: write game data to database
    }
    
}