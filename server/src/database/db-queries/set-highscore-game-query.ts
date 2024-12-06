import { encodeDecimal } from "../db-misc";
import { WriteDBQuery } from "../db-query";


export class SetHighscoreGameQuery extends WriteDBQuery {
    public override query = `
        INSERT INTO highscore_games (userid, game_id)
        VALUES ($1, $2);
    `;

    public override warningMs = null;

    constructor(userid: string, gameID: string) {
        super([userid, gameID]);
    }
}