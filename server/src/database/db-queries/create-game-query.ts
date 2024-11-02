import { encodeDecimal } from "../db-misc";
import { WriteDBQuery } from "../db-query";


export class CreateGameQuery extends WriteDBQuery {
    public override query = `
        INSERT INTO games (userid, start_level, end_score, end_level, end_lines, accuracy, tetris_rate)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;

    public override warningMs = null;

    constructor(game: {
        userid: string,
        start_level: number,
        end_score: number,
        end_level: number,
        end_lines: number,
        accuracy: number | null,
        tetris_rate: number
    }) {
        super([
            game.userid,
            game.start_level,
            game.end_score,
            game.end_level,
            game.end_lines,
            game.accuracy ? encodeDecimal(game.accuracy, 2) : game.accuracy,
            encodeDecimal(game.tetris_rate, 2)
        ]);
    }


}