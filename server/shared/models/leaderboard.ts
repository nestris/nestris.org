import { League } from '../nestris-org/league-system';

export interface RelativeLeaderboardRank {
    rank: number;
    userid: string;
    username: string;
    score: number;
}

// A 3-tuple of RelativeLeaderboardRank, where the first element means the player who is better than the current player,
// the second element is the current player, and the third element is the player who is worse than the current player.
// If the first element is null, it means the current player is the best player.
// If the third element is null, it means the current player is the worst player.
export type RelativeLeaderboard = (RelativeLeaderboardRank | null)[];

type RelativeLeaderboardInfo = {
    playingNow: number;
    leaderboard: RelativeLeaderboard;
}
export interface RelativeLeaderboards {
    solo: RelativeLeaderboardInfo;
    ranked: RelativeLeaderboardInfo;
    puzzles: RelativeLeaderboardInfo;
}

export enum T200LeaderboardType {
    SOLO_XP = 'solo',
    SOLO_HIGHSCORE = 'highscore',
    RANKED = 'ranked',
    PUZZLES = 'puzzles',
}

// what the type of resource ID is
export enum ResourceIDType {
    GAME = 'game',
    MATCH = 'match',
}

export interface T200LeaderboardData {
    type: T200LeaderboardType;
    resourceIDType: ResourceIDType | null;
    attributes: { [key: string]: string };
    leaderboard: T200LeaderboardRow[];
}

export interface T200LeaderboardRow {
    rank: number;
    userid: string;
    username: string;
    isOnline: boolean;
    inActivity: boolean;
    league: League;
    score: number;
    resourceID: string | null;
}