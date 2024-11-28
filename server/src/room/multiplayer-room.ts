
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { ClientRoomEvent, RoomType } from "../../shared/room/room-models";
import { Room } from "../online-users/event-consumers/room-consumer";
import { UserSessionID } from "../online-users/online-user";
import { calculateScoreForPlayer, MatchPoint, MultiplayerRoomEventType, MultiplayerRoomState, MultiplayerRoomStatus, PlayerIndex, PlayerInfo } from "../../shared/room/multiplayer-room-models";
import { GameEndEvent, GamePlayer, GameStartEvent, NO_XP_STRATEGY } from "./game-player";
import { GymRNG } from "../../shared/tetris/piece-sequence-generation/gym-rng";
import { DBUserObject } from "../database/db-objects/db-user";
import { PacketAssembler } from "../../shared/network/stream-packets/packet-assembler";
import { OnlineUserActivityType } from "../../shared/models/activity";

export class MultiplayerRoom extends Room<MultiplayerRoomState> {

    // The two players in the room
    protected gamePlayers: {[PlayerIndex.PLAYER_1]: GamePlayer, [PlayerIndex.PLAYER_2]: GamePlayer};

    private previousGame: {[PlayerIndex.PLAYER_1]: GameEndEvent | null, [PlayerIndex.PLAYER_2]: GameEndEvent | null} = {
        [PlayerIndex.PLAYER_1]: null,
        [PlayerIndex.PLAYER_2]: null,
    };

    // If the match was ended due to a player resigning, this flag is set
    private playerResigned: boolean = false;

    /**
     * Creates a new SoloRoom for the single player with the given playerSessionID
     * @param playerSessionID The playerSessionID of the player in the room
     */
    constructor(
        player1SessionID: UserSessionID,
        player2SessionID: UserSessionID,
        private readonly ranked: boolean,
        private readonly startLevel: number,
    ) {

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

        // Reset previousGame when a new game starts
        this.iterateGamePlayers((player, index) => player.onGameStart$().subscribe(async (event: GameStartEvent) => {
            this.previousGame[index] = null;
        }));

        // Update room state when each player's game ends, and if both games have ended, update room state
        this.iterateGamePlayers((player, index) => player.onGameEnd$().subscribe(async (event: GameEndEvent) => {
            this.previousGame[index] = event;

            // Only trigger onBothPlayersEndGame if both players have ended the game and neither player has resigned
            if (this.previousGame[PlayerIndex.PLAYER_1] && this.previousGame[PlayerIndex.PLAYER_2] && !this.playerResigned) {
                await this.onBothPlayersEndGame(
                    this.previousGame[PlayerIndex.PLAYER_1],
                    this.previousGame[PlayerIndex.PLAYER_2]
                );
            }
        }));
    }

    /**
     * Iterate over each GamePlayer in the room
     * @param callback The callback to execute for each player
     */
    protected iterateGamePlayers<T>(callback: (player: GamePlayer, index: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2) => T): T[] {
        return [PlayerIndex.PLAYER_1, PlayerIndex.PLAYER_2].map(playerIndex => {
            const pi = playerIndex as (PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2);
            return callback(this.gamePlayers[pi], pi);
        });
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
            startLevel: this.startLevel,
            ranked: this.ranked,
            winningScore: 2,
            players: {
                [PlayerIndex.PLAYER_1]: await this.getInfoForPlayer(PlayerIndex.PLAYER_1),
                [PlayerIndex.PLAYER_2]: await this.getInfoForPlayer(PlayerIndex.PLAYER_2),
            },

            points: [],
            currentSeed: GymRNG.generateRandomSeed(),
            lastGameWinner: null,
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

        // Resend message to all other players in the room, prefixing with the player index
        this.sendToAllExcept(sessionID, PacketAssembler.encodeIndexFromPacketDisassembler(message, playerIndex));

        // Handle each packet individually
        while (message.hasMorePackets()) {
            const packet = message.nextPacket();
            await player.handlePacket(packet);
        }
    }

    /**
     * Handle a event sent by a client in the room
     * @param sessionID The sessionID of the player
     * @param event The event sent by the player
     */
    protected async onClientRoomEvent(sessionID: string, event: ClientRoomEvent): Promise<void> {
        const playerIndex = this.getPlayerIndex(sessionID);

        const state = this.getRoomState();

        switch (event.type) {

            // Update the room state when a player is ready
            case MultiplayerRoomEventType.READY:
                if (state.status === MultiplayerRoomStatus.BEFORE_GAME && !state.ready[playerIndex]) {
                    state.ready[playerIndex] = true;
                    this.updateRoomState(state);

                    // If both players are ready, start game after a short delay
                    if (state.ready[PlayerIndex.PLAYER_1] && state.ready[PlayerIndex.PLAYER_2]) {
                        setTimeout(() => {
                            this.updateRoomState(Object.assign({}, state, { status: MultiplayerRoomStatus.IN_GAME }));
                        }, 1000);
                    }
                }
                break;
        }
    }

    /**
     * Handle both players ending the game, so update match point and transition to AFTER_GAME state
     */
    private async onBothPlayersEndGame(player1Game: GameEndEvent, player2Game: GameEndEvent): Promise<void> {
        console.log('Both players have ended the game');

        const state = this.getRoomState();

        // Calculate the winner
        let winner: PlayerIndex;
        if (player1Game.score > player2Game.score) winner = PlayerIndex.PLAYER_1;
        else if (player1Game.score < player2Game.score) winner = PlayerIndex.PLAYER_2;
        else winner = PlayerIndex.DRAW;
        state.lastGameWinner = winner;

        // Update the match point
        const point: MatchPoint = {
            seed: state.currentSeed,
            winner: winner,
            game: {
                [PlayerIndex.PLAYER_1]: { gameID: player1Game.gameID, score: player1Game.score },
                [PlayerIndex.PLAYER_2]: { gameID: player2Game.gameID, score: player2Game.score },
            }
        }
        state.points.push(point);

        // TODO: add database logic to save the match point

        // Reset ready status for both players for next game
        state.ready = { [PlayerIndex.PLAYER_1]: false, [PlayerIndex.PLAYER_2]: false };

        // Check if the match is over
        const player1Score = calculateScoreForPlayer(state.points, PlayerIndex.PLAYER_1);
        const player2Score = calculateScoreForPlayer(state.points, PlayerIndex.PLAYER_2);
        if (player1Score >= state.winningScore || player2Score >= state.winningScore) {
            // Match is over
            if (player1Score > player2Score) state.matchWinner = PlayerIndex.PLAYER_1;
            else if (player1Score < player2Score) state.matchWinner = PlayerIndex.PLAYER_2;
            else state.matchWinner = PlayerIndex.DRAW;

            state.status = MultiplayerRoomStatus.AFTER_MATCH;

            // End the match
            await this.onMatchEnd(state);
        } else {
            // Match is ongoing
            state.currentSeed = GymRNG.generateRandomSeed();
            state.status = MultiplayerRoomStatus.BEFORE_GAME;
        }

        // Update the room state
        this.updateRoomState(state);
    }

    /**
     * On room deletion by player leaving, if match still ongoing, end ongoing games and end match early by resignation
     * @param playerLeftID The sessionID of the player that left the room
     */
    protected override async onDelete(playerLeftID: string): Promise<void> { 

        // If match already ended, do nothing
        if (this.getRoomState().status === MultiplayerRoomStatus.AFTER_MATCH) return;
        
        // Set resignation flag
        this.playerResigned = true;
        
        // End ongoing games for both players and save them
        await Promise.all(Object.values(this.gamePlayers).map(player => player.onDelete()));

        // Mark match as won by resignation, where the player that left the room loses
        const state = this.getRoomState();
        state.wonByResignation = true;
        state.matchWinner = this.getPlayerIndex(playerLeftID) === PlayerIndex.PLAYER_1 ? PlayerIndex.PLAYER_2 : PlayerIndex.PLAYER_1;

        // End the match
        await this.onMatchEnd(state);

        // Update the room state with resignation flag and match winner
        this.updateRoomState(state);
    }

    /**
     * Override to handle the end of the match
     * @param state The state of the room
     */
    protected async onMatchEnd(state: MultiplayerRoomState): Promise<void> {}
}