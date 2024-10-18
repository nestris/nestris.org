/*
Routes relevant to puzzle operations in control panel
*/

import { Request, Response } from 'express';
import { PuzzleAggregate } from '../../shared/puzzles/puzzle-aggregate';
import { queryDB } from '../database-old';

export async function getPuzzleAggregate(req: Request, res: Response) {

    const query = `
    SELECT rating, COUNT(*), SUM(num_attempts_cached) as total_attempts, SUM(num_solves_cached) as total_solves
    FROM rated_puzzles
    GROUP BY rating
    ORDER BY rating ASC
    `;
    const result = await queryDB(query, []);

    let aggregate: PuzzleAggregate = { ratings: [] };
    for (let row of result.rows) {
        aggregate.ratings.push({
            rating: row.rating,
            numPuzzles: parseInt(row.count),
            totalAttempts: parseInt(row.total_attempts),
            totalSolves: parseInt(row.total_solves)
        });
    }

    res.send(aggregate);
}