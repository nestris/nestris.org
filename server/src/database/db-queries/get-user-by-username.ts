import { DBUser, DBUserAttributes } from "../../../shared/models/db-user";
import { DBQuery } from "../db-query";

// Check if a username already exists in the database
export class GetUserByUsername extends DBQuery<DBUser> {
   public override query = `
        SELECT ${DBUserAttributes.join(',')} FROM users WHERE username = $1
    `;

    // No specific warning message
    public override warningMs = null;

    constructor(private readonly username: string) {
        // Passing the username as the parameter for the query
        super([username]);
    }

    public override parseResult(resultRows: any[]): DBUser {

        if (resultRows.length === 0) {
            throw new Error(`User with username ${this.username} not found`);
        }

        return resultRows[0] as DBUser;
    }
}