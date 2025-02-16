import { Subject, Observable } from "rxjs";
import { GameState } from "../../shared/game-state-from-packets/game-state";
import { MeMessage } from "../../shared/network/json-message";
import { PacketContent, PacketOpcode, GameStartSchema, GamePlacementSchema, StackRabbitPlacementSchema } from "../../shared/network/stream-packets/packet";
import { PacketAssembler } from "../../shared/network/stream-packets/packet-assembler";
import { DBUserObject, DBGameEndEvent } from "../database/db-objects/db-user";
import { CreateGameQuery } from "../database/db-queries/create-game-query";
import { Database } from "../database/db-query";
import { OnlineUserManager } from "../online-users/online-user-manager";
import { v4 as uuid } from 'uuid';
import { calculatePlacementScore, EvaluationRating, placementScoreRating } from "../../shared/evaluation/evaluation";
import { EventConsumerManager } from "../online-users/event-consumer";
import { QuestConsumer } from "../online-users/event-consumers/quest-consumer";
import { QuestCategory, QuestID } from "../../shared/nestris-org/quest-system";

// Event that is emitted when a game starts
export interface GameStartEvent {
    level: number;
    current: number;
    next: number;
}

// Event that is emitted when a game ends
export interface GameEndEvent {
    gameID: string;
    state: GameState,
    accuracy: number;
    packets: PacketAssembler;
    xpGained: number;
    isPersonalBest: boolean;
    forced: boolean; // If the game was forced to end due to onDelete() call, this is true
}

// Strategy for calculating XP gained for a game
export interface XPStrategy {
    (score: number): number;
}

// By default, no XP is gained
export const NO_XP_STRATEGY: XPStrategy = (score: number) => 0;

interface PlacementEvaluation {
    bestEval: number;
    playerEval: number;
}

interface AccuracyStats {
    overallAccuracy: number;
    average_eval_loss: number; // non-negative number
    ratingCount: { [key in EvaluationRating]?: number };
}

// List of packet opcodes to ignore when saving to the database
const DATABASE_PACKET_IGNORE_LIST: PacketOpcode[] = [
    PacketOpcode.STACKRABBIT_PLACEMENT
];


// Track consecutive instances of something happening for the purpose of quests. Check if positive progress has been made
class ConsecutiveTracker {
    private count: number = 0;

    constructor(
        private readonly userid: string,
        private readonly category: QuestCategory,
    ) {}

    increment() {
        this.count++;
        EventConsumerManager.getInstance().getConsumer(QuestConsumer).updateQuestCategory(this.userid, this.category, this.count);
    }

    reset() {
        this.count = 0;
    }
}

/**
 * Represents a player in a game room. Handles server-side logic of a player playing games
 * in a room. It maintains the current game state of the player and aggregates packets when
 * game packets come through, detect game start and end, save finished games, and update
 * user stats.
 */
export class GamePlayer {

    // The current game state for the player
    private gameState: GameState | null = null;

    // A list of accuracy scores for each placement
    private placementEvaluations: PlacementEvaluation[] = [];

    // The aggregation of packets for the player's current game
    private packets: PacketAssembler = new PacketAssembler();

    // need at least one placement to save the game
    private hasAtLeastOnePlacement: boolean = false;

    private consecBestPlacements: ConsecutiveTracker;
    private consecTetrises: ConsecutiveTracker;

    private gameStart$ = new Subject<GameStartEvent>();
    private gameEnd$ = new Subject<GameEndEvent>();

    constructor(
        private readonly Users: OnlineUserManager,
        public readonly userid: string,
        public readonly username: string,
        public readonly sessionID: string,
        private readonly xpStrategy: XPStrategy = NO_XP_STRATEGY
    ) {
        this.consecBestPlacements = new ConsecutiveTracker(this.userid, QuestCategory.PERFECTION);
        this.consecTetrises = new ConsecutiveTracker(this.userid, QuestCategory.EFFICIENCY);
    }

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
            await this.onGameEnd(this.packets, this.gameState, this.placementEvaluations, true);
        }
    }

    /**
     * Handle a packet from the player, updating the game state and processing the packet
     * @param packet The packet to process
     */
    public async handlePacket(packet: PacketContent) {

        // Add packet to the aggregation to be saved to the database if not in the ignore list
        if (!DATABASE_PACKET_IGNORE_LIST.includes(packet.opcode)) this.packets.addPacketContent(packet.binary);

        // Process packet and update game state
        if (packet.opcode === PacketOpcode.GAME_START) {

            console.log(`Received game start packet from player ${this.username}`);
            const gameStart = (packet.content as GameStartSchema);
            this.gameState = new GameState(gameStart.level, gameStart.current, gameStart.next);

            this.hasAtLeastOnePlacement = false;

            this.consecBestPlacements.reset();
            this.consecTetrises.reset();

            // Emit the game start event
            this.gameStart$.next({
                level: gameStart.level,
                current: gameStart.current,
                next: gameStart.next
            });

        } else if (packet.opcode === PacketOpcode.GAME_PLACEMENT) {
            if (!this.gameState) throw new Error("Cannot add game placement packet without game start packet");

            // Update game state with placement
            const gamePlacement = (packet.content as GamePlacementSchema);
            this.hasAtLeastOnePlacement = true;
            const { numLinesCleared } = this.gameState.onPlacement(gamePlacement.mtPose, gamePlacement.nextNextType, gamePlacement.pushdown);

            // Check if any progress on 'Efficiency' quests for number of consecutive tetrises
            if (numLinesCleared === 4) this.consecTetrises.increment();
            else if (numLinesCleared > 0) this.consecTetrises.reset();

            // Check if any progress on score or line quests on line clear
            if (numLinesCleared > 0) {
                const questConsumer = EventConsumerManager.getInstance().getConsumer(QuestConsumer);
                const snapshot = this.gameState.getSnapshotWithoutBoard();

                questConsumer.updateQuestCategory(this.userid, QuestCategory.SCORE, snapshot.score);
                questConsumer.updateQuestCategory(this.userid, QuestCategory.SURVIVOR, (questID => {
                    // Survivor I tracks lines
                    if (questID === QuestID.SURVIVOR_I) return snapshot.lines;
                    // Survivor II+ tracks level from non-29 start
                    else return this.gameState!.startLevel >= 29 ? 0 : snapshot.level;
                }));
                if (this.gameState!.startLevel === 29) questConsumer.updateQuestCategory(this.userid, QuestCategory.LINES29, snapshot.lines);
            }
        }

        else if (packet.opcode === PacketOpcode.STACKRABBIT_PLACEMENT) {
            // Add the accuracy score to the list
            const stackrabbitPlacement = (packet.content as StackRabbitPlacementSchema);
            this.placementEvaluations.push(stackrabbitPlacement);

            // Check if any progress on 'Perfection' quests for number of consecutive best placements
            const rating = placementScoreRating(calculatePlacementScore(stackrabbitPlacement.bestEval, stackrabbitPlacement.playerEval));
            if ([EvaluationRating.BRILLIANT, EvaluationRating.BEST].includes(rating)) this.consecBestPlacements.increment();
            else this.consecBestPlacements.reset();
        }

        else if (packet.opcode === PacketOpcode.GAME_END) {
            console.log(`Received game end packet from player ${this.username}`);

            // Handle the end of the game
            await this.onGameEnd(this.packets, this.gameState!, this.placementEvaluations, false);

            // Reset game state and packets
            this.gameState = null;
            this.packets = new PacketAssembler();
            this.placementEvaluations = [];
        }
    }

    /**
     * Handle the end of the game, writing the game state to the database and updating XP/quests
     * @param packets The aggregation of packets for the game
     * @param gameState The final game state of the player
     * @param placementAccuracyScores The list of accuracy scores for each placement
     * @returns The gameID of the game that was written to the database
     */
    private async onGameEnd(packets: PacketAssembler, gameState: GameState, placementEvaluations: PlacementEvaluation[], forced: boolean): Promise<string> {

        // Get the final game state
        const state = gameState.getSnapshot();

        // Assign a unique game ID
        const gameID = uuid();

        // Calculate overall game accuracy
        const accuracyStats = this.calculateAccuracyStats(placementEvaluations);

        // Calculate XP gained based on injected strategy
        const xpGained = this.xpStrategy(state.score);

        // Get previous highscore
        const previousHighscore = (await DBUserObject.get(this.userid)).highest_score;

        // Write game to database
        if (this.hasAtLeastOnePlacement) {

            const binary: Uint8Array = packets.encode();
            console.log(`Saving game with bytes: ${binary.byteLength}`);
            await Database.query(CreateGameQuery, {
                id: gameID,
                data: binary,
                userid: this.userid,
                start_level: gameState.startLevel,
                end_level: state.level,
                end_score: state.score,
                end_lines: state.lines,
                accuracy: accuracyStats.overallAccuracy,
                tetris_rate: state.tetrisRate,
                xp_gained: xpGained,
                average_eval_loss: accuracyStats.average_eval_loss,
                brilliant_count: accuracyStats.ratingCount[EvaluationRating.BRILLIANT] || 0,
                best_count: accuracyStats.ratingCount[EvaluationRating.BEST] || 0,
                excellent_count: accuracyStats.ratingCount[EvaluationRating.EXCELLENT] || 0,
                good_count: accuracyStats.ratingCount[EvaluationRating.GOOD] || 0,
                inaccurate_count: accuracyStats.ratingCount[EvaluationRating.INACCURACY] || 0,
                mistake_count: accuracyStats.ratingCount[EvaluationRating.MISTAKE] || 0,
                blunder_count: accuracyStats.ratingCount[EvaluationRating.BLUNDER] || 0,
            });

            // Update user stats from game
            await DBUserObject.alter(this.userid, new DBGameEndEvent({
                xpGained: xpGained,
                gameID: gameID,
                score: state.score,
                level: state.level,
                lines: state.lines,
                transitionInto19: state.transitionInto19,
                transitionInto29: state.transitionInto29,
                numPlacements: state.numPlacements,
            }), false);

        } else console.log(`Not saving game for player ${this.username} because no placements were made`);
        
        // Emit the game end event
        this.gameEnd$.next(
            {
                gameID,
                state: gameState,
                accuracy: accuracyStats.overallAccuracy,
                packets,
                xpGained,
                isPersonalBest: state.score > previousHighscore,
                forced
            }
        );        

        // For full games to level 29, update accuracy quests
        if (gameState.startLevel < 29 && state.level >= 29) {
            const questConsumer = EventConsumerManager.getInstance().getConsumer(QuestConsumer);
            questConsumer.updateQuestCategory(this.userid, QuestCategory.ACCURACY, accuracyStats.overallAccuracy);
        }

        return gameID;
    }

    /**
     * Calculate the overall accuracy of the player's placements for the game
     * @param placementAccuracyScores The list of accuracy scores for each placement
     */
    private calculateAccuracyStats(placementEvaluations: PlacementEvaluation[]): AccuracyStats {

        // Return 0 if no placements have been rated
        if (placementEvaluations.length === 0) return {
            overallAccuracy: 0,
            average_eval_loss: 0,
            ratingCount: {}
        }

        const placementScores = placementEvaluations.map(pe => calculatePlacementScore(pe.bestEval, pe.playerEval));

        // Calculate the average eval loss
        const evalLosses = placementEvaluations.map(pe => pe.bestEval - pe.playerEval);
        const average_eval_loss = evalLosses.reduce((a, b) => a + b) / evalLosses.length;

        // Calculate the average accuracy score
        let overallAccuracy = placementScores.reduce((a, b) => a + b) / placementScores.length;
        overallAccuracy = Math.round(overallAccuracy * 1000) / 10; // Round to 1 decimal place as a percentage
        

        // Count the number of ratings
        const ratingCount: { [key in EvaluationRating]?: number } = {};
        for (let score of placementScores) {
            const rating = placementScoreRating(score);
            if (ratingCount[rating]) ratingCount[rating]++;
            else ratingCount[rating] = 1;
        }

        console.log(`Overall accuracy: ${overallAccuracy}%`);
        console.log(`Average eval loss: ${average_eval_loss}`);
        console.log(`Rating count: ${JSON.stringify(ratingCount)}`);

        return {
            overallAccuracy,
            average_eval_loss,
            ratingCount
        }
    }
}
