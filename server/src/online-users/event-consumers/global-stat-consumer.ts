import { GlobalStat, GlobalStats } from "../../../shared/models/global-stat";
import { DBPuzzleSubmitEvent, DBUserObject } from "../../database/db-objects/db-user";
import { Database, DBQuery } from "../../database/db-query";
import { EventConsumer } from "../event-consumer";

// Count the number of users in the database
export class CountUsersQuery extends DBQuery<number> {
    public override query = `SELECT reltuples AS estimate FROM pg_class where relname = 'users';`;
    public override warningMs = null;

    public override parseResult(resultRows: any[]): number {
        if (resultRows.length === 0) throw new Error('Count of users not found');

        return parseInt(resultRows[0].estimate);
    }
}

export class CountPuzzlesSolvedQuery extends DBQuery<number> {
    public override query = `SELECT SUM(puzzles_solved) FROM users;`;
    public override warningMs = null;

    public override parseResult(resultRows: any[]): number {
        if (resultRows.length === 0) throw new Error('Count of puzzles solved not found');

        return parseInt(resultRows[0].sum);
    }
}

/**
 * Consumer for handling guests. On guest disconnect, delete the guest user from the database.
 */
export class GlobalStatConsumer extends EventConsumer {

    private stats: GlobalStats = {
        [GlobalStat.TOTAL_USER_COUNT]: 0,
        [GlobalStat.TOTAL_PUZZLES_SOLVED]: 0,
    }

    public override async init(): Promise<void> {

        // Query database for initial total user count, and increment it when a new user is created
        this.stats[GlobalStat.TOTAL_USER_COUNT] = await Database.query(CountUsersQuery);
        DBUserObject.onCreate().subscribe(() => this.stats[GlobalStat.TOTAL_USER_COUNT]++);

        // Query database for initial total puzzles solved count, and increment it when a user solves a puzzle
        this.stats[GlobalStat.TOTAL_PUZZLES_SOLVED] = await Database.query(CountPuzzlesSolvedQuery);
        DBUserObject.onChange().subscribe((change) => {
            if (change.event instanceof DBPuzzleSubmitEvent && change.event.args.isCorrect) {
                this.stats[GlobalStat.TOTAL_PUZZLES_SOLVED]++;
            }
        });
        
        // Print the initial stats
        console.log('Initial stats:', this.stats);
    }

    public getStats(): GlobalStats {
        return this.stats;
    }
}