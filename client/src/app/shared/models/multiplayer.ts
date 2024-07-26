import { Role } from "./room-info";

export type PlayerRole = Role.PLAYER_1 | Role.PLAYER_2;

export enum MultiplayerRoomMode {
    WAITING = "WAITING",
    COUNTDOWN = "COUNTDOWN",
    PLAYING = "PLAYING",
    MATCH_ENDED = "MATCH_ENDED",
}

export enum MultiplayerPlayerMode {
    NOT_READY = "NOT_READY",
    READY = "READY",
    IN_GAME = "IN_GAME",
    DEAD = "DEAD",
}

export interface MultiplayerPlayerState {

    mode: MultiplayerPlayerMode;
    score: number;

}

export interface MultiplayerRoomState {
    startLevel: number;
    mode: MultiplayerRoomMode;
    levelPicker: PlayerRole;
    players: {[role in PlayerRole]: MultiplayerPlayerState};
}

export interface MatchPoint {
    seed: string;
    gameIDPlayer1: string;
    scorePlayer1: number;
    gameIDPlayer2: string;
    scorePlayer2: number;
}

export interface MatchResult {
    matchID: string;
    isRanked: boolean;
    seed: string;
    winningScore: number;
    validStartLevels: number[];
    points: MatchPoint[];
}

export interface MultiplayerData {
    state: MultiplayerRoomState;
    match: MatchResult;
}

export function getMatchScore(match: MatchResult): [number, number] {
    let score1 = 0;
    let score2 = 0;
    for (const point of match.points) {
        if (point.scorePlayer1 > point.scorePlayer2) {
            score1++;
        } else if (point.scorePlayer1 < point.scorePlayer2) {
            score2++;
        }
    }
    return [score1, score2];
}

export function getMatchWinner(match: MatchResult): PlayerRole | null {
    const [score1, score2] = getMatchScore(match);
    if (score1 >= match.winningScore) return Role.PLAYER_1;
    if (score2 >= match.winningScore) return Role.PLAYER_2;
    return null;
}