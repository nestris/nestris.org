import { DBGame, DBGameAttributes } from "../../../shared/models/db-game";
import { SortOrder } from "../../../shared/models/query";
import { DBQuery } from "../db-query";

// Get a list of games by some sort criteria
export class GetGamesQuery extends DBQuery<DBGame[]> {
  public override query = `
    SELECT 
      ${DBGameAttributes.map(attr => `g.${attr}`).join(',')},
      CASE WHEN gd.game_id IS NULL THEN false ELSE true END AS data_exists
    FROM games AS g
    LEFT JOIN game_data AS gd
      ON g.id = gd.game_id
    WHERE g.userid = $1
    ORDER BY g.${this.sortKey} ${this.sortOrder}
    LIMIT $2;
  `;

  public override warningMs = null;

  constructor(
    userid: string,
    private readonly sortKey: string,
    private readonly sortOrder: SortOrder = SortOrder.DESCENDING,
    limit: number = 100
  ) {
    super([userid, limit]);
  }

  public override parseResult(resultRows: any[]): DBGame[] {
    // The result rows already contain all fields in DBGame plus data_exists
    return resultRows;
  }
}
