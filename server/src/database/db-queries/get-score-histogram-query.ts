import { DBQuery } from "../db-query";

// Get a histogram of scores, where score_range is the score divided by 100000
export class GetScoreHistogramQuery extends DBQuery<number[]> {


    public override query = `
        SELECT
            CASE
                WHEN end_score BETWEEN 1 AND 99999 THEN 0
                WHEN end_score BETWEEN 100000 AND 199999 THEN 1
                WHEN end_score BETWEEN 200000 AND 299999 THEN 2
                WHEN end_score BETWEEN 300000 AND 399999 THEN 3
                WHEN end_score BETWEEN 400000 AND 499999 THEN 4
                WHEN end_score BETWEEN 500000 AND 599999 THEN 5
                WHEN end_score BETWEEN 600000 AND 699999 THEN 6
                WHEN end_score BETWEEN 700000 AND 799999 THEN 7
                WHEN end_score BETWEEN 800000 AND 899999 THEN 8
                WHEN end_score BETWEEN 900000 AND 999999 THEN 9
                WHEN end_score BETWEEN 1000000 AND 1099999 THEN 10
                WHEN end_score BETWEEN 1100000 AND 1199999 THEN 11
                WHEN end_score BETWEEN 1200000 AND 1299999 THEN 12
                WHEN end_score BETWEEN 1300000 AND 1399999 THEN 13
                WHEN end_score BETWEEN 1400000 AND 1499999 THEN 14
                WHEN end_score BETWEEN 1500000 AND 1599999 THEN 15
                WHEN end_score >= 1600000 THEN 16
                ELSE -1
            END AS score_range,
            COUNT(*) AS count
        FROM games
        WHERE userid = $1
        GROUP BY score_range
        ORDER BY score_range;
    `;

    public override warningMs = null;

    constructor(id: string) {
        super([id]);
    }

    public override parseResult(resultRows: any[]): number[] {
        
        const histogram: number[] = Array.from({length: 17}, () => 0);
        for (const row of resultRows) {
            if (row.score_range >= 0 && row.score_range < 17) {
                histogram[row.score_range] = row.count;
            }
        }

        return histogram;
    }
}