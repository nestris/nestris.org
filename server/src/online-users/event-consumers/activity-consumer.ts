import { Activity, ActivityType, TimestampedActivity } from "../../../shared/models/activity";
import { Database, DBQuery, WriteDBQuery } from "../../database/db-query";
import { EventConsumer } from "../event-consumer";

class CreateActivityQuery extends WriteDBQuery {
    public override readonly query = `INSERT INTO activities (userid, data) VALUES ($1, $2)`;
    public override readonly warningMs = null;

    constructor(userid: string, data: Activity) {
        super([userid, data]);
    }
}

class GetActivitiesForUserQuery extends DBQuery<TimestampedActivity[]> {

    public override readonly query = `
        SELECT id, created_at, data
        FROM activities
        WHERE userid = $1
        ORDER BY created_at DESC
    `;

    public override readonly warningMs = null;

    constructor(userid: string) {
        super([userid]);
    }

    public override parseResult(resultRows: any[]): TimestampedActivity[] {
        return resultRows.map((row) => ({
            timestamp: row.created_at,
            activity: row.data as Activity,
        }));
    }
}

// Handles events related to users
export class ActivityConsumer extends EventConsumer {

    public async createActivity(userid: string, data: Activity) {
        await Database.query(CreateActivityQuery, userid, data);
    }

    public async getActivitiesForUser(userid: string): Promise<TimestampedActivity[]> {
        return await Database.query(GetActivitiesForUserQuery, userid);
    }

}