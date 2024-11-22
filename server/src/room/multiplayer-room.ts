
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { ClientRoomEvent, RoomType } from "../../shared/room/room-models";
import { Room } from "../online-users/event-consumers/room-consumer";
import { OnlineUserActivityType, UserSessionID } from "../online-users/online-user";
import { calculateScoreForPlayer, MatchPoint, MultiplayerRoomEventType, MultiplayerRoomState, MultiplayerRoomStatus, PlayerIndex, PlayerInfo } from "../../shared/room/multiplayer-room-models";
import { GameEndEvent, GamePlayer, GameStartEvent } from "./game-player";
import { GymRNG } from "../../shared/tetris/piece-sequence-generation/gym-rng";
import { DBUserObject } from "../database/db-objects/db-user";
import { BinaryEncoder } from "../../shared/network/binary-codec";
import { MAX_PLAYER_BITCOUNT, PacketAssembler } from "../../shared/network/stream-packets/packet-assembler";
import { stat } from "fs";

export class MultiplayerRoom extends Room<MultiplayerRoomState> {

    // The two players in the room
    private gamePlayers: {[PlayerIndex.PLAYER_1]: GamePlayer, [PlayerIndex.PLAYER_2]: GamePlayer};

    private previousGame: {[PlayerIndex.PLAYER_1]: GameEndEvent | null, [PlayerIndex.PLAYER_2]: GameEndEvent | null} = {
        [PlayerIndex.PLAYER_1]: null,
        [PlayerIndex.PLAYER_2]: null,
    };

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

        // Reset previousGame when a new game starts
        this.iterateGamePlayers((player, index) => player.onGameStart$().subscribe(async (event: GameStartEvent) => {
            this.previousGame[index] = null;
        }));

        // Update room state when each player's game ends, and if both games have ended, update room state
        this.iterateGamePlayers((player, index) => player.onGameEnd$().subscribe(async (event: GameEndEvent) => {
            this.previousGame[index] = event;

            if (this.previousGame[PlayerIndex.PLAYER_1] && this.previousGame[PlayerIndex.PLAYER_2]) {
                this.onBothPlayersEndGame(
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
    private iterateGamePlayers(callback: (player: GamePlayer, index: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2) => void): void {
        for (const playerIndex of [PlayerIndex.PLAYER_1, PlayerIndex.PLAYER_2]) {
            const pi = playerIndex as (PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2);
            callback(this.gamePlayers[pi], pi);
        }
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
        } else {
            // Match is ongoing
            state.currentSeed = GymRNG.generateRandomSeed();
            state.status = MultiplayerRoomStatus.BEFORE_GAME;
        }

        // Update the room state
        this.updateRoomState(state);
    }

    /**
     * Cleanup logic for all players in the room when the room is about to be deleted
     */
    protected override async onDelete(): Promise<void> {        
        await Promise.all(Object.values(this.gamePlayers).map(player => player.onDelete()));
    }
}