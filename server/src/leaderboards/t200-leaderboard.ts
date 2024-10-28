import { T200LeaderboardRow, T200SoloXPLeaderboardRow } from "../../shared/models/leaderboard";
import { getLeagueFromIndex, LEAGUE_XP_REQUIREMENTS } from "../../shared/nestris-org/league-system";
import { Database, DBQuery } from "../database/db-query";
import { sortLeaderboard } from "./sort-leaderboard";

/**
 * A top-200 leaderboard is not cached but periodically queried from the database.
 * 
 * @template T The info 
 */
export abstract class T200Leaderboard<row extends T200LeaderboardRow> {

    /**
     * The top 200 leaderboard rows, ordered by rank
     */
    private leaderboard: row[] = [];

    public async updateLeaderboard() {
        this.leaderboard = await this.populateLeaderboard();
        sortLeaderboard(this.leaderboard);
    }

    public get() {
        return this.leaderboard;
    }

    /**
     * Get the top 200 leaderboard rows from a SQL query
     */
    protected abstract populateLeaderboard(): Promise<row[]>;
}

export class T200XPLeaderboard extends T200Leaderboard<T200SoloXPLeaderboardRow> {

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
                    userid: row.userid,
                    username: row.username,
                    league: row.league,
                    xp: row.xp,
                    highscore: row.highscore,
                    trophies: row.trophies,
                    puzzle_elo: row.puzzle_elo,

                    // score is league as whole number plus xp as fraction
                    score: row.league + row.xp / LEAGUE_XP_REQUIREMENTS[getLeagueFromIndex(row.league)],
                })); 
            }
        }
        
        return await Database.query(T200XPLeaderboardQuery);
    }
}