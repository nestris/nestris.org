import { encodeDecimal } from "../db-misc";
import { WriteDBQuery } from "../db-query";

export class CreateGameQuery extends WriteDBQuery {
    public override query = `
        WITH ins_games AS (
            INSERT INTO games (id, userid, start_level, end_score, end_level, end_lines, accuracy, tetris_rate, xp_gained,
            average_eval_loss, brilliant_count, best_count, excellent_count, good_count, inaccurate_count, mistake_count, blunder_count)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        )
        INSERT INTO game_data (game_id, data) VALUES ($1, $18)
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
        average_eval_loss: number,
        brilliant_count: number,
        best_count: number,
        excellent_count: number,
        good_count: number,
        inaccurate_count: number,
        mistake_count: number,
        blunder_count: number,
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
            game.average_eval_loss,
            game.brilliant_count,
            game.best_count,
            game.excellent_count,
            game.good_count,
            game.inaccurate_count,
            game.mistake_count,
            game.blunder_count,
            game.data
        ]);
    }


}