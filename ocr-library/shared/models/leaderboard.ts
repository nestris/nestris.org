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
    USER = 'user',
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
    league: League;
    score: number;
    resourceID: string | null;
}

export interface T200SoloXPLeaderboardRow extends T200LeaderboardRow {
    xp: number;
    highscore: number;
    trophies: number;
    puzzle_elo: number;
}

export interface T200SoloHighscoreLeaderboardRow extends T200LeaderboardRow {
    highscore: number;
    highscore_level: number;
    highscore_lines: number;
    highscore_start_level: number;
    highscore_accuracy: number | null;
}


export interface T200RankedLeaderboardRow extends T200LeaderboardRow {
    trophies: number;
    highest_trophies: number;
    wins: number;
    losses: number;
    matches_played: number;
}

export interface T200PuzzlesLeaderboardRow extends T200LeaderboardRow {
    puzzle_elo: number;
    highest_puzzle_elo: number;
    puzzles_attempted: number;
    puzzles_solved: number;
    average_solve_seconds: number;
}