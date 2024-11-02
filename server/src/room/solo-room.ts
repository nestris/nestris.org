import { GameState } from "../../shared/game-state-from-packets/game-state";
import { GamePlacementSchema, GameStartSchema, PacketContent, PacketOpcode } from "../../shared/network/stream-packets/packet";
import { PacketAssembler } from "../../shared/network/stream-packets/packet-assembler";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { RoomType } from "../../shared/room/room-models";
import { SoloRoomState } from "../../shared/room/solo-room-models";
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

    /**
     * Creates a new SoloRoom for the single player with the given playerSessionID
     * @param playerSessionID The playerSessionID of the player in the room
     */
    constructor(playerSessionID: string) {
        super(
            [playerSessionID],
            { type: RoomType.SOLO, serverInGame: false },
        )

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

        const score = gameState.getStatus().score;
        const level = gameState.getStatus().level;
        const lines = gameState.getStatus().lines;
        const xpGained = 0; // TODO: calculate XP gained

        // Write game to database
        await Database.query(CreateGameQuery, {
            id: gameID,
            userid: this.userid,
            start_level: gameState.startLevel,
            end_level: level,
            end_score: score,
            end_lines: lines,
            accuracy: null, // TODO: calculate accuracy
            tetris_rate: gameState.getTetrisRate(),
            xp_gained: xpGained // TODO: calculate XP gained
        });

        // Add game to list of solo games
        DBSoloGamesListView.alter(this.userid, new DBSoloGamesListAddEvent(gameID, score, xpGained));

        // TODO: write game data to database

    }
    
}