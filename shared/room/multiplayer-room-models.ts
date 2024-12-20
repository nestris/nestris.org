import { RoomState, RoomType } from "./room-models";

export enum PlayerIndex {
    PLAYER_1 = 0,
    PLAYER_2 = 1,
    DRAW = 2,
}


export interface GameInfo {
    gameID: string;
    score: number;
}

export interface MatchPoint {
    seed: string;
    winner: PlayerIndex;
    game: {[PlayerIndex.PLAYER_1]: GameInfo, [PlayerIndex.PLAYER_2]: GameInfo};
}

// 1 point for each game won, 0.5 for each draw
export function calculateScoreForPlayer(points: MatchPoint[], player: PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2): number {
    return points.reduce((score, point) => {
        if (point.winner === player) {
            return score + 1;
        } else if (point.winner === PlayerIndex.DRAW) {
            return score + 0.5;
        } else {
            return score;
        }
    }, 0);
}

export function pointWinner(point: MatchPoint): PlayerIndex.PLAYER_1 | PlayerIndex.PLAYER_2 | PlayerIndex.DRAW {
    if (point.game[PlayerIndex.PLAYER_1].score > point.game[PlayerIndex.PLAYER_2].score) {
        return PlayerIndex.PLAYER_1;
    } else if (point.game[PlayerIndex.PLAYER_1].score < point.game[PlayerIndex.PLAYER_2].score) {
        return PlayerIndex.PLAYER_2;
    } else {
        return PlayerIndex.DRAW;
    }
}

export enum MultiplayerRoomStatus {
    BEFORE_GAME = 'BEFORE_GAME',
    IN_GAME = 'IN_GAME',
    AFTER_MATCH = 'AFTER_MATCH',
}

export interface PlayerInfo {
    userid: string;
    username: string;
    sessionID: string;
    trophies: number;
    leftRoom: boolean;
    trophyDelta: TrophyDelta;
}

export interface MultiplayerRoomState extends RoomState {
    type: RoomType.MULTIPLAYER;

    // Immutable
    startLevel: number;
    ranked: boolean;
    winningScore: number;
    players: {[PlayerIndex.PLAYER_1]: PlayerInfo, [PlayerIndex.PLAYER_2]: PlayerInfo};

    // Mutable
    points: MatchPoint[];
    currentSeed: string;
    lastGameWinner: PlayerIndex | null; // null if before first game
    matchWinner: PlayerIndex | null; // null if match is ongoing
    wonByResignation: boolean;

    ready: {[PlayerIndex.PLAYER_1]: boolean, [PlayerIndex.PLAYER_2]: boolean};
    status: MultiplayerRoomStatus;
}

export interface XPDelta {
    xpGain: number;
    xpLoss: number;
}

export interface TrophyDelta {
    trophyGain: number;
    trophyLoss: number;
}

export enum MultiplayerRoomEventType {
    READY = 'READY',
}