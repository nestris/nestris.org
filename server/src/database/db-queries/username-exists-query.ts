import { DBQuery } from "../db-query";

// Check if a username already exists in the database
export class UsernameExistsQuery extends DBQuery<boolean> {
    // The query checks if the username already exists in the "users" table
    public override query = `
        SELECT username
        FROM "public"."users"
        WHERE "username" = $1
        LIMIT 1;
    `;

    // No specific warning message
    public override warningMs = null;

    constructor(private readonly username: string) {
        // Passing the username as the parameter for the query
        super([username]);
    }

    public override parseResult(resultRows: any[]): boolean {

        // If the query returns at least one row, the username exists
        return resultRows.length > 0;
    }
}