import { ResourceIDType, T200LeaderboardData, T200LeaderboardRow, T200LeaderboardType, T200SoloHighscoreLeaderboardRow, T200SoloXPLeaderboardRow } from "../../shared/models/leaderboard";
import { getLeagueFromIndex, LEAGUE_XP_REQUIREMENTS } from "../../shared/nestris-org/league-system";
import { Database, DBQuery } from "../database/db-query";
import { OnlineUserManager } from "../online-users/online-user-manager";
import { sortLeaderboard } from "./sort-leaderboard";

/**
 * A top-200 leaderboard is not cached but periodically queried from the database.
 * 
 * @template T The info 
 */
export abstract class T200Leaderboard<row extends T200LeaderboardRow> {

    // The type of T200 leaderboard
    public abstract readonly type: T200LeaderboardType;

    public abstract readonly resourceIDType: ResourceIDType | null;

    // A map of attribute keys to their display names
    public abstract readonly attributes: { [key: string]: string };

    /**
     * The top 200 leaderboard rows, ordered by rank
     */
    private leaderboard: row[] = [];

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
    protected abstract populateLeaderboard(): Promise<row[]>;
}

export class T200XPLeaderboard extends T200Leaderboard<T200SoloXPLeaderboardRow> {

    public override readonly type = T200LeaderboardType.SOLO_XP;
    public override readonly resourceIDType = ResourceIDType.USER;
    public override readonly attributes = {
        xp: 'XP',
        highscore: 'Highscore',
        trophies: 'Trophies',
        puzzle_elo: 'Puzzle elo',
    };

    protected async populateLeaderboard(): Promise<T200SoloXPLeaderboardRow[]> {

        // Query the top 200 XP leaderboard
        class T200XPLeaderboardQuery extends DBQuery<T200SoloXPLeaderboardRow[]> {
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

            public override parseResult(resultRows: any[]): T200SoloXPLeaderboardRow[] {
                return resultRows.map((row) => ({
                    rank: -1,
                    isOnline: false,

                    userid: row.userid,
                    username: row.username,
                    league: row.league,
                    xp: row.xp,
                    highscore: row.highscore,
                    trophies: row.trophies,
                    puzzle_elo: row.puzzle_elo,

                    resourceID: row.userid,

                    // score is league as whole number plus xp as fraction
                    score: row.league + row.xp / LEAGUE_XP_REQUIREMENTS[getLeagueFromIndex(row.league)],
                })); 
            }
        }
        
        return await Database.query(T200XPLeaderboardQuery);
    }
}

export class T200HighscoreLeaderboard extends T200Leaderboard<T200SoloHighscoreLeaderboardRow> {

    public override readonly type = T200LeaderboardType.SOLO_HIGHSCORE;
    public override readonly resourceIDType = ResourceIDType.GAME;
    public override readonly attributes = {
        highscore: 'Score',
        highscore_level: 'Level',
        highscore_lines: 'Lines',
        highscore_start_level: 'Start level',
        highscore_accuracy: 'Accuracy',
    };

    protected async populateLeaderboard(): Promise<T200SoloHighscoreLeaderboardRow[]> {

        // Query the top 200 XP leaderboard
        class T200XPLeaderboardQuery extends DBQuery<T200SoloHighscoreLeaderboardRow[]> {
            public override query = `
                SELECT
                    users.userid, username, league, xp, games.end_score as highscore, games.end_level as highscore_level, games.end_lines as highscore_lines, games.start_level as highscore_start_level, games.accuracy as highscore_accuracy, games.id as game_id
                FROM
                    users
                INNER JOIN
                    highscore_games ON users.userid = highscore_games.userid
                LEFT JOIN
                    games ON highscore_games.game_id = games.id
                ORDER BY
                    highscore
                LIMIT 200
            `;

            public override warningMs = null;

            public override parseResult(resultRows: any[]): T200SoloHighscoreLeaderboardRow[] {
                return resultRows.map((row) => ({
                    rank: -1,
                    isOnline: false,
                    
                    userid: row.userid,
                    username: row.username,
                    league: row.league,
                    
                    highscore: row.highscore,
                    highscore_level: row.highscore_level,
                    highscore_lines: row.highscore_lines,
                    highscore_start_level: row.highscore_start_level,
                    highscore_accuracy: row.highscore_accuracy,

                    resourceID: row.game_id,
                    score: row.highscore,
                })); 
            }
        }
        
        return await Database.query(T200XPLeaderboardQuery);
    }
}