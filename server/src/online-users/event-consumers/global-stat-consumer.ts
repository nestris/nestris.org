import { GlobalStat, GlobalStats } from "../../../shared/models/global-stat";
import { DBUserObject } from "../../database/db-objects/db-user";
import { CountUsersQuery } from "../../database/db-queries/count-users-queries";
import { Database } from "../../database/db-query";
import { EventConsumer } from "../event-consumer";

/**
 * Consumer for handling guests. On guest disconnect, delete the guest user from the database.
 */
export class GlobalStatConsumer extends EventConsumer {

    private stats: GlobalStats = {
        [GlobalStat.TOTAL_USER_COUNT]: 0,
    }

    public override async init(): Promise<void> {

        // Query database for initial total user count, and increment it when a new user is created
        this.stats[GlobalStat.TOTAL_USER_COUNT] = await Database.query(CountUsersQuery);
        DBUserObject.onCreate().subscribe(() => this.stats[GlobalStat.TOTAL_USER_COUNT]++);
        
        // Print the initial stats
        console.log('Initial stats:', this.stats);
    }

    public getStats(): GlobalStats {
        return this.stats;
    }
}