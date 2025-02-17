import { ResourceIDType, T200LeaderboardData, T200LeaderboardRow, T200LeaderboardType } from "../../shared/models/leaderboard";
import { getLeagueFromIndex, LEAGUE_XP_REQUIREMENTS } from "../../shared/nestris-org/league-system";
import { Database, DBQuery } from "../database/db-query";
import { OnlineUserManager } from "../online-users/online-user-manager";
import { sortLeaderboard } from "./sort-leaderboard";

/**
 * A top-200 leaderboard is not cached but periodically queried from the database.
 * 
 * @template T The info 
 */
export abstract class T200Leaderboard {

    // The type of T200 leaderboard
    public abstract readonly type: T200LeaderboardType;

    public abstract readonly resourceIDType: ResourceIDType | null;

    // A map of attribute keys to their display names
    public abstract readonly attributes: { [key: string]: string };

    /**
     * The top 200 leaderboard rows, ordered by rank
     */
    private leaderboard: T200LeaderboardRow[] = [];

    private users!: OnlineUserManager;

    public init(users: OnlineUserManager) {
        this.users = users;
    }

    public async updateLeaderboard() {
        this.leaderboard = await this.populateLeaderboard();
        sortLeaderboard(this.leaderboard);

        // Update whether users are online
        for (const user of this.leaderboard) {
            user.isOnline = this.users.isUserOnline(user.userid);
            user.inActivity = this.users.isUserInActivity(user.userid);
        }
    }

    public get(): T200LeaderboardData {
        return {
            type: this.type,
            resourceIDType: this.resourceIDType,
            attributes: this.attributes,
            leaderboard: this.leaderboard,
        }
    }

    /**
     * Get the top 200 leaderboard rows from a SQL query
     */
    protected abstract populateLeaderboard(): Promise<T200LeaderboardRow[]>;
}

export class T200XPLeaderboard extends T200Leaderboard {

    public override readonly type = T200LeaderboardType.SOLO_XP;
    public override readonly resourceIDType = null;
    public override readonly attributes = {
        xp: 'XP',
        highest_score: 'Highscore',
        trophies: 'Trophies',
        puzzle_elo: 'Puzzle elo',
    };


    protected override async populateLeaderboard(): Promise<T200LeaderboardRow[]> {

        // Query the top 200 XP leaderboard
        class T200XPLeaderboardQuery extends DBQuery<T200LeaderboardRow[]> {
            public override query = `
                SELECT
                    userid, username, league, xp, highest_score, trophies, puzzle_elo   
                FROM
                    users
                ORDER BY
                    league DESC, xp DESC
                LIMIT 200
            `;

            public override warningMs = null;

            public override parseResult(resultRows: any[]): T200LeaderboardRow[] {
                return resultRows.map((row) => ({
                    rank: -1,
                    isOnline: false,
                    inActivity: false,

                    userid: row.userid,
                    username: row.username,
                    league: row.league,
                    xp: row.xp,
                    highest_score: row.highest_score,
                    trophies: row.trophies,
                    puzzle_elo: row.puzzle_elo,

                    resourceID: null,

                    // score is league as whole number plus xp as fraction
                    score: row.league + row.xp / LEAGUE_XP_REQUIREMENTS[getLeagueFromIndex(row.league)],
                })); 
            }
        }
        
        return await Database.query(T200XPLeaderboardQuery);
    }
}

export class T200HighscoreLeaderboard extends T200Leaderboard {

    public override readonly type = T200LeaderboardType.SOLO_HIGHSCORE;
    public override readonly resourceIDType = ResourceIDType.GAME;
    public override readonly attributes = {
        highest_score: 'Score',
        highscore_lines: 'Lines',
        highscore_start_level: 'Start level',
        highscore_accuracy: 'Accuracy',
        games_played: 'Games played',
    };

    protected async populateLeaderboard(): Promise<T200LeaderboardRow[]> {

        // Query the top 200 XP leaderboard
        class T200HighscoreLeaderboardQuery extends DBQuery<T200LeaderboardRow[]> {
            public override query = `
                SELECT
                    users.userid, username, league, games_played, games.end_score as highscore, games.end_lines as highscore_lines, games.start_level as highscore_start_level, games.accuracy as highscore_accuracy, games.id as game_id
                FROM
                    users
                INNER JOIN
                    highscore_games ON users.userid = highscore_games.userid
                LEFT JOIN
                    games ON highscore_games.game_id = games.id
                ORDER BY
                    highscore DESC
                LIMIT 200
            `;

            public override warningMs = null;

            public override parseResult(resultRows: any[]): T200LeaderboardRow[] {
                return resultRows.map((row) => ({
                    rank: -1,
                    isOnline: false,
                    inActivity: false,
                    
                    userid: row.userid,
                    username: row.username,
                    league: row.league,
                    
                    highest_score: row.highscore,
                    highscore_lines: row.highscore_lines,
                    highscore_start_level: row.highscore_start_level,
                    highscore_accuracy: row.highscore_accuracy / 10000,
                    games_played: row.games_played,

                    resourceID: row.game_id,
                    score: row.highscore,
                })); 
            }
        }
        
        return await Database.query(T200HighscoreLeaderboardQuery);
    }
}

export class T200RankedLeaderboard extends T200Leaderboard {

    public override readonly type = T200LeaderboardType.RANKED;
    public override readonly resourceIDType = null;
    public override readonly attributes = {
        trophies: 'Trophies',
        highest_trophies: 'Best',
        win_loss: 'Win-Loss',
        matches_played: 'Matches Played',
    };

    protected async populateLeaderboard(): Promise<T200LeaderboardRow[]> {

        class T200RankedLeaderboardQuery extends DBQuery<T200LeaderboardRow[]> {
            public override query = `
                SELECT
                    userid, username, league, trophies, highest_trophies, matches_played, CONCAT(wins, '-', losses) as win_loss
                FROM
                    users
                ORDER BY
                    trophies DESC
                LIMIT 200
            `;

            public override warningMs = null;

            public override parseResult(resultRows: any[]): T200LeaderboardRow[] {
                return resultRows.map((row) => ({
                    rank: -1,
                    isOnline: false,
                    inActivity: false,

                    userid: row.userid,
                    username: row.username,
                    league: row.league,

                    trophies: row.trophies,
                    highest_trophies: row.highest_trophies,
                    win_loss: row.win_loss,
                    matches_played: row.matches_played,

                    resourceID: null,

                    score: row.trophies,
                })); 
            }
        }
        
        return await Database.query(T200RankedLeaderboardQuery);
    }
}

export class T200PuzzlesLeaderboard extends T200Leaderboard {

    public override readonly type = T200LeaderboardType.PUZZLES;
    public override readonly resourceIDType = null;
    public override readonly attributes = {
        puzzle_elo: 'Rating',
        highest_puzzle_elo: 'Best',
        puzzles_solved: 'Puzzles Solved',
        solve_time: 'Solve Time',
        solve_rate: 'Solve Rate',
    };

    protected async populateLeaderboard(): Promise<T200LeaderboardRow[]> {

        class T200RankedLeaderboardQuery extends DBQuery<T200LeaderboardRow[]> {
            public override query = `
                SELECT
                    userid, username, league, puzzle_elo, highest_puzzle_elo, puzzles_attempted, puzzles_solved, puzzle_seconds_played
                FROM
                    users
                ORDER BY
                    puzzle_elo DESC
                LIMIT 200
            `;

            public override warningMs = null;

            public override parseResult(resultRows: any[]): T200LeaderboardRow[] {
                return resultRows.map((row) => ({
                    rank: -1,
                    isOnline: false,
                    inActivity: false,

                    userid: row.userid,
                    username: row.username,
                    league: row.league,

                    puzzle_elo: row.puzzle_elo,
                    highest_puzzle_elo: row.highest_puzzle_elo,
                    puzzles_solved: row.puzzles_solved,
                    solve_time: row.puzzles_attempted === 0 ? '-' : (row.puzzle_seconds_played / row.puzzles_attempted).toFixed(1)+'s',
                    solve_rate: row.puzzles_attempted === 0 ? '-' : (row.puzzles_solved / row.puzzles_attempted * 100).toFixed(1)+'%',

                    resourceID: null,

                    score: row.puzzle_elo,
                })); 
            }
        }
        
        return await Database.query(T200RankedLeaderboardQuery);
    }
}