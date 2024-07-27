import { v4 as uuid } from "uuid";
import { getMatchWinner, MatchPlayerInfo, MatchPlayerStakes, MatchInfo, MultiplayerData, MultiplayerPlayerMode, MultiplayerRoomMode, MultiplayerRoomState, PlayerRole } from "../../shared/models/multiplayer";
import { Role } from "../../shared/models/room-info";
import { UserSession } from "./online-user";


const BOTH_READY_COUNTDOWN_SECONDS = 5;
export class MultiplayerManager {

    private players: {[role in PlayerRole]: UserSession};

    // Current state about the room
    private state!: MultiplayerRoomState;

    // Current state about the match
    private match!: MatchInfo;

    private countdownTimeout: NodeJS.Timeout | null = null;

    private topoutPlayerGameID: string | null = null;
    private topoutPlayerScore: number | null = null;

    constructor(
        private readonly isRanked: boolean,
        player1: UserSession,
        player2: UserSession,

        // Whenever room state is updated, this function is called to notify the client
        private readonly sendToClient: (data: MultiplayerData) => void,
    ) {
        this.players = {
            [Role.PLAYER_1]: player1,
            [Role.PLAYER_2]: player2,
        };
    }

    private async getMatchPlayerInfo(role: PlayerRole): Promise<MatchPlayerInfo> {
        return {
            userID: this.players[role].user.userid,
            username: this.players[role].user.username,
            trophiesBeforeMatch: 1000, // TODO: Get actual trophies from database
        };
    }

    // Calculate the stakes for the match by using the player's current trophies to determine the stakes
    private async getMatchPlayerStakes(player: MatchPlayerInfo): Promise<MatchPlayerStakes> {
        return {
            winXP: 10, // TODO: Get actual XP
            winTrophies: 20, // TODO: Get actual trophies
            loseTrophies: 10, // TODO: Get actual trophies
        };
    }

    async init() {

        // TEMPORARY
        const validStartLevels = [15, 18, 19];
        const winningScore = 2;

        // Initialize the multiplayer room state
        this.state = {
            startLevel: validStartLevels[ Math.floor(validStartLevels.length / 2) ],
            mode: MultiplayerRoomMode.WAITING,
            levelPicker: Role.PLAYER_1,
            players: {
                [Role.PLAYER_1]: {
                    mode: MultiplayerPlayerMode.NOT_READY,
                    score: 0,
                },
                [Role.PLAYER_2]: {
                    mode: MultiplayerPlayerMode.NOT_READY,
                    score: 0,
                },
            },
        };

        // Fetch player info for the match
        const playerInfo = {
            [Role.PLAYER_1]: await this.getMatchPlayerInfo(Role.PLAYER_1),
            [Role.PLAYER_2]: await this.getMatchPlayerInfo(Role.PLAYER_2),
        };

        // For ranked matches, calculate the stakes for the match
        const playerStakes = this.isRanked ? {
            [Role.PLAYER_1]: await this.getMatchPlayerStakes(playerInfo[Role.PLAYER_1]),
            [Role.PLAYER_2]: await this.getMatchPlayerStakes(playerInfo[Role.PLAYER_2]),
        } : undefined;

        // Initialize the match info
        this.match = {
            matchID: uuid(),
            isRanked: this.isRanked,
            seed: "6EF248",
            winningScore: winningScore,
            validStartLevels: validStartLevels,
            points: [],
            playerInfo: playerInfo,
            playerStakes: playerStakes,
        };
    }

    setPlayerReady(role: PlayerRole) {

        if (this.state.mode != MultiplayerRoomMode.WAITING) throw new Error("Room must be in WAITING mode");
        this.state.players[role].mode = MultiplayerPlayerMode.READY;

        if (this.state.players[Role.PLAYER_1].mode === MultiplayerPlayerMode.READY &&
            this.state.players[Role.PLAYER_2].mode === MultiplayerPlayerMode.READY) {
            this.state.mode = MultiplayerRoomMode.COUNTDOWN;
            this.update();

            this.countdownTimeout = setTimeout(() => {
                this.state.mode = MultiplayerRoomMode.PLAYING;
                this.update();
            }, BOTH_READY_COUNTDOWN_SECONDS * 1000);
        }
    }

    setPlayerNotReady(role: PlayerRole) {

        if (![MultiplayerRoomMode.WAITING, MultiplayerRoomMode.COUNTDOWN].includes(this.state.mode)) {
            throw new Error("Room must be in WAITING or COUNTDOWN mode");
        }
        this.state.players[role].mode = MultiplayerPlayerMode.NOT_READY;
        this.state.mode = MultiplayerRoomMode.WAITING;
        if (this.countdownTimeout) {
            clearTimeout(this.countdownTimeout);
            this.countdownTimeout = null;
        }
        this.update();
    }

    selectLevelForPlayer(role: PlayerRole, level: number) {
            
        if (this.state.mode != MultiplayerRoomMode.WAITING) throw new Error("Room must be in WAITING mode");
        if (this.state.levelPicker != role) throw new Error("Not this player's turn to pick level");
        if (this.state.players[role].mode != MultiplayerPlayerMode.NOT_READY) throw new Error("Player must be in NOT_READY mode");
        if (!this.match.validStartLevels.includes(level)) throw new Error("Invalid level selection");

        this.state.levelPicker = role === Role.PLAYER_1 ? Role.PLAYER_2 : Role.PLAYER_1;
        this.update();
    }

    // Only when certain conditions are met, will a game start packet be accepted. Otherwise, it should be ignored.
    // Return whether to accept the packet, and update state if so
    onGameStartPacket(role: PlayerRole): boolean {

        // Only can start game when in COUNTDOWN or already PLAYING
        if (![MultiplayerRoomMode.COUNTDOWN, MultiplayerRoomMode.PLAYING].includes(this.state.mode)) {
            return false;
        }

        // Only can start game if player is in READY mode (i.e. not already in game or dead)
        if (this.state.players[role].mode != MultiplayerPlayerMode.READY) {
            return false;
        }

        // Conditions are met. Move player to IN_GAME mode
        this.state.players[role].mode = MultiplayerPlayerMode.IN_GAME;
        this.update();

        return true;
    }

    // Only should move player mode from IN_GAME to DEAD. Ignore otherwise.
    // Return a new game uuid if game should be saved and accepted as a valid game during the match
    onGameEndPacket(role: PlayerRole, score: number): string | null {

        // In a special case where game that was started in countdown ends in countdown, go back to READY mode
        if (this.state.mode === MultiplayerRoomMode.COUNTDOWN && this.state.players[role].mode === MultiplayerPlayerMode.IN_GAME) {
            this.state.players[role].mode = MultiplayerPlayerMode.READY;
            this.update();

            // This isn't a valid game though
            return null;
        }

        /* Otherwise, only move player to DEAD mode if in PLAYING mode */

        // Room to be in PLAYING mode to end game
        if (this.state.mode != MultiplayerRoomMode.PLAYING) return null;

        // Player has to be in IN_GAME mode to end game
        if (this.state.players[role].mode != MultiplayerPlayerMode.IN_GAME) return null;
        
        // Conditions are met. Move player to DEAD mode
        this.state.players[role].mode = MultiplayerPlayerMode.DEAD;
        const myGameID = uuid();

        if (this.topoutPlayerGameID === null || this.topoutPlayerScore === null) {
            // if this is the first player that is dead, save the game id and score
            this.topoutPlayerGameID = myGameID;
            this.topoutPlayerScore = score;

        } else { // Otherwise, the entire match point ended. Save the match point
            
            this.match.points.push({
                seed: this.match.seed,
                gameIDPlayer1: role === Role.PLAYER_1 ? this.topoutPlayerGameID : myGameID,
                scorePlayer1: role === Role.PLAYER_1 ? this.topoutPlayerScore : score,
                gameIDPlayer2: role === Role.PLAYER_2 ? this.topoutPlayerGameID : myGameID,
                scorePlayer2: role === Role.PLAYER_2 ? this.topoutPlayerScore : score,
            });
            this.topoutPlayerGameID = null;
            this.topoutPlayerScore = null;

            if (getMatchWinner(this.match)) {
                // If reached winning score, entire match ended
                this.state.mode = MultiplayerRoomMode.MATCH_ENDED;   
            } else {
                // Otherwise, reset for next match point
                this.state.mode = MultiplayerRoomMode.WAITING;
                this.state.levelPicker = this.state.levelPicker === Role.PLAYER_1 ? Role.PLAYER_2 : Role.PLAYER_1;
            }
        }

        // Push updates to multiplayer and match state
        this.update();

        // Return the id of the game that just ended for the player, so that the game can be saved
        return myGameID;
    }

    isPlayerInGame(role: PlayerRole): boolean {
        return this.state.players[role].mode === MultiplayerPlayerMode.IN_GAME;
    }

    private update() {
        this.sendToClient(this.getData());
    }

    getData(): MultiplayerData {
        return { state: this.state, match: this.match };
    }
}