import { DBGame, DBGameAttributes } from "../../../shared/models/db-game";
import { DBQuery } from "../db-query";

export interface DBGameWithData {
    game: DBGame,
    data: Uint8Array | null,
}

// Get a specific game by game id
export class GetGameQuery extends DBQuery<DBGameWithData> {

    private attributes = DBGameAttributes.map((attr) => `g.${attr}`);

    public override query = `
        SELECT 
          ${this.attributes.join(',')}, 
          gd.data,
          u.username,
          rank() OVER (ORDER BY g.end_score DESC) AS rank
        FROM games AS g
        LEFT JOIN game_data AS gd 
          ON g.id = gd.game_id
        LEFT JOIN users AS u
          ON g.userid = u.userid
        WHERE g.id = $1;
    `;

    public override warningMs = null;

    constructor(id: string) {
        super([id]);
    }

    public override parseResult(resultRows: any[]): DBGameWithData {

        if (resultRows.length === 0) {
            throw new Error('Game not found');
        }

        const result = resultRows[0];
        const data = result.data ? new Uint8Array(result.data) : null;
        delete result.data;
        return { game: result, data };
    }
}