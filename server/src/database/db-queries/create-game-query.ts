import { encodeDecimal } from "../db-misc";
import { WriteDBQuery } from "../db-query";


export class CreateGameQuery extends WriteDBQuery {
    public override query = `
        WITH ins_games AS (
            INSERT INTO games (id, userid, start_level, end_score, end_level, end_lines, accuracy, tetris_rate, xp_gained)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        )
        INSERT INTO game_data (game_id, data) VALUES ($1, $10);
    `;

    public override warningMs = null;

    constructor(game: {
        id: string,
        userid: string,
        start_level: number,
        end_score: number,
        end_level: number,
        end_lines: number,
        accuracy: number | null,
        tetris_rate: number,
        xp_gained: number,
        data: Uint8Array,
    }) {
        super([
            game.id,
            game.userid,
            game.start_level,
            game.end_score,
            game.end_level,
            game.end_lines,
            game.accuracy ? encodeDecimal(game.accuracy, 2) : game.accuracy,
            encodeDecimal(game.tetris_rate, 2),
            game.xp_gained,
            game.data
        ]);
    }


}