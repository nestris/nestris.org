import { DBQuery } from "../db-query";

// Count the number of users in the database
export class CountUsersQuery extends DBQuery<number> {
    public override query = `SELECT reltuples AS estimate FROM pg_class where relname = 'users';`;
    public override warningMs = null;

    public override parseResult(resultRows: any[]): number {
        if (resultRows.length === 0) throw new Error('Count of users not found');

        return resultRows[0].estimate;
    }
}