import { GameState } from "../../shared/game-state-from-packets/game-state";
import { GamePlacementSchema, GameStartSchema, PacketContent, PacketOpcode } from "../../shared/network/stream-packets/packet";
import { PacketAssembler } from "../../shared/network/stream-packets/packet-assembler";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { RoomType } from "../../shared/room/room-models";
import { SoloRoomState } from "../../shared/room/solo-room-models";
import { Room } from "../online-users/event-consumers/room-consumer";

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
            { type: RoomType.SOLO, },
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
            this.handlePacket(packet);
        }
    }

    private handlePacket(packet: PacketContent): void {

        // Add packet to the aggregation
        this.packets.addPacketContent(packet.binary);

        // Process packet and update game state
        if (packet.opcode === PacketOpcode.GAME_START) {

            console.log(`Received game start packet from player ${this.username}`);
            const gameStart = (packet.content as GameStartSchema);
            this.gameState = new GameState(gameStart.level, gameStart.current, gameStart.next);

        } else if (packet.opcode === PacketOpcode.GAME_PLACEMENT) {
            if (!this.gameState) throw new Error("Cannot add game placement packet without game start packet");
            const gamePlacement = (packet.content as GamePlacementSchema);
            this.gameState.onPlacement(gamePlacement.mtPose, gamePlacement.nextNextType, gamePlacement.pushdown);
            console.log(`Player ${this.username} now has score: ${this.gameState.getStatus().score}`);
        }

        else if (packet.opcode === PacketOpcode.GAME_END) {
            console.log(`Received game end packet from player ${this.username}`);
            this.gameState = null;
            this.packets = new PacketAssembler();
        }

    }
    
}