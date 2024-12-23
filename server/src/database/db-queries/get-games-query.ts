import { DBGame, DBGameAttributes } from "../../../shared/models/db-game";
import { SortOrder } from "../../../shared/models/query";
import { DBQuery } from "../db-query";

// Get a list of games by some sort criteria
export class GetGamesQuery extends DBQuery<DBGame[]> {

    public override query = `
        SELECT ${DBGameAttributes.join(',')} FROM games WHERE userid = $1 ORDER BY ${this.sortKey} ${this.sortOrder} LIMIT $2;
    `;

    public override warningMs = null;

    constructor(userid: string,
        private readonly sortKey: string,
        private readonly sortOrder: SortOrder = SortOrder.DESCENDING,
        limit: number = 100
    ) { super([userid, limit]); }

    public override parseResult(resultRows: any[]): DBGame[] {
        return resultRows;
    }
}