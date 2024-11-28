import { Subject, Observable } from "rxjs";
import { GameState } from "../../shared/game-state-from-packets/game-state";
import { MeMessage } from "../../shared/network/json-message";
import { PacketContent, PacketOpcode, GameStartSchema, GamePlacementSchema } from "../../shared/network/stream-packets/packet";
import { PacketAssembler } from "../../shared/network/stream-packets/packet-assembler";
import { DBUserObject, DBGameEndEvent } from "../database/db-objects/db-user";
import { CreateGameQuery } from "../database/db-queries/create-game-query";
import { Database } from "../database/db-query";
import { OnlineUserManager } from "../online-users/online-user-manager";
import { v4 as uuid } from 'uuid';

// Event that is emitted when a game starts
export interface GameStartEvent {
    level: number;
    current: number;
    next: number;
}

// Event that is emitted when a game ends
export interface GameEndEvent {
    gameID: string;
    score: number;
    level: number;
    lines: number;
    xpGained: number;
}

// Strategy for calculating XP gained for a game
export interface XPStrategy {
    (score: number): number;
}

// By default, no XP is gained
export const NO_XP_STRATEGY: XPStrategy = (score: number) => 0;

/**
 * Represents a player in a game room. Handles server-side logic of a player playing games
 * in a room. It maintains the current game state of the player and aggregates packets when
 * game packets come through, detect game start and end, save finished games, and update
 * user stats.
 */
export class GamePlayer {

    // The current game state for the player
    private gameState: GameState | null = null;

    // The aggregation of packets for the player's current game
    private packets: PacketAssembler = new PacketAssembler();

    private gameStart$ = new Subject<GameStartEvent>();
    private gameEnd$ = new Subject<GameEndEvent>();

    constructor(
        private readonly Users: OnlineUserManager,
        public readonly userid: string,
        public readonly username: string,
        public readonly sessionID: string,
        private readonly xpStrategy: XPStrategy = NO_XP_STRATEGY
    ) {}

    /**
     * Subscribe to the game start event to execute additional logic when the game starts
     */
    public onGameStart$(): Observable<GameStartEvent> {
        return this.gameStart$.asObservable();
    }

    /**
     * Subscribe to the game end event to execute additional logic when the game ends
     */
    public onGameEnd$(): Observable<GameEndEvent> {
        return this.gameEnd$.asObservable();
    }

    /**
     * Should be called when room is about to be deleted. Handles ending the game and saving the game state
     */
    public async onDelete() {
        // If in the middle of a game, end the game and save the game state
        if (this.gameState) {
            await this.onGameEnd(this.packets, this.gameState);
        }
    }

    /**
     * Handle a packet from the player, updating the game state and processing the packet
     * @param packet The packet to process
     */
    public async handlePacket(packet: PacketContent) {

        // Add packet to the aggregation
        this.packets.addPacketContent(packet.binary);

        // Process packet and update game state
        if (packet.opcode === PacketOpcode.GAME_START) {

            console.log(`Received game start packet from player ${this.username}`);
            const gameStart = (packet.content as GameStartSchema);
            this.gameState = new GameState(gameStart.level, gameStart.current, gameStart.next);

            // Emit the game start event
            this.gameStart$.next({
                level: gameStart.level,
                current: gameStart.current,
                next: gameStart.next
            });

        } else if (packet.opcode === PacketOpcode.GAME_PLACEMENT) {
            if (!this.gameState) throw new Error("Cannot add game placement packet without game start packet");
            const gamePlacement = (packet.content as GamePlacementSchema);
            this.gameState.onPlacement(gamePlacement.mtPose, gamePlacement.nextNextType, gamePlacement.pushdown);
        }

        else if (packet.opcode === PacketOpcode.GAME_END) {
            console.log(`Received game end packet from player ${this.username}`);

            // Handle the end of the game
            await this.onGameEnd(this.packets, this.gameState!);

            // Reset game state and packets
            this.gameState = null;
            this.packets = new PacketAssembler();
        }
    }

    /**
     * Handle the end of the game, writing the game state to the database and updating XP/quests
     * @param packets The aggregation of packets for the game
     * @param gameState The final game state of the player
     * @returns The gameID of the game that was written to the database
     */
    private async onGameEnd(packets: PacketAssembler, gameState: GameState): Promise<string> {

        // Get the final game state
        const state = gameState.getSnapshot();

        // Assign a unique game ID
        const gameID = uuid();

        // Calculate XP gained based on injected strategy
        const xpGained = this.xpStrategy(state.score);

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
            xp_gained: xpGained
        });


        // Update user stats from game
        await DBUserObject.alter(this.userid, new DBGameEndEvent({
            users: this.Users,
            sessionID: this.sessionID,
            xpGained: xpGained,
            score: state.score,
            level: state.level,
            lines: state.lines,
            transitionInto19: state.transitionInto19,
            transitionInto29: state.transitionInto29,
            perfectTransitionInto19: state.perfectInto19,
            perfectTransitionInto29: state.perfectInto29,
        }), false);
        
        

        // TODO: write game data to database

        // Emit the game end event
        this.gameEnd$.next(
            {
                gameID,
                score: state.score,
                level: state.level,
                lines: state.lines,
                xpGained
            }
        );

        return gameID;
    }
}
