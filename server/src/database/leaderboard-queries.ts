import { Request, Response } from 'express';
import { queryDB } from '.';
import { PuzzleLeaderboard } from '../../shared/models/leaderboard';

// Fetch the top 200 users by puzzle elo rating
export async function getPuzzleLeaderboard(): Promise<PuzzleLeaderboard> {

const leaderboardQuery = `
    SELECT 
        u.username,
        u.userid,
        u.puzzle_elo as rating,
        u.highest_puzzle_elo as best,
        COALESCE(pa.puzzles_solved, 0) as puzzles_solved,
        COALESCE(pa.solve_rate, 0) as solve_rate,
        COALESCE(pa.avg_puzzle_rating, 0) as avg_puzzle_rating,
        COALESCE(pa.avg_solve_time, 0) as avg_solve_time
    FROM 
        users u
    LEFT JOIN (
        SELECT 
            pa.userid,
            COUNT(CASE WHEN pa.is_correct = true THEN 1 END) as puzzles_solved,
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(COUNT(CASE WHEN pa.is_correct = true THEN 1 END)::numeric / COUNT(*) * 100, 2)
            END as solve_rate,
            ROUND(AVG(rp.rating)::numeric, 2) as avg_puzzle_rating,
            ROUND(AVG(pa.solve_time)::numeric, 2) as avg_solve_time
        FROM 
            puzzle_attempts pa
        JOIN
            rated_puzzles rp ON pa.puzzle_id = rp.id
        GROUP BY 
            pa.userid
    ) pa ON u.userid = pa.userid
    ORDER BY 
        u.puzzle_elo DESC
    LIMIT 200
`;

const result = await queryDB(leaderboardQuery, []);

const leaderboard: PuzzleLeaderboard = {
    rows: result.rows.map(row => ({
        username: row.username,
        userid: row.userid,
        rating: row.rating,
        best: row.best,
        puzzlesSolved: parseInt(row.puzzles_solved),
        solveRate: parseFloat(row.solve_rate),
        avgSolveTime: parseFloat(row.avg_solve_time)
    }))
};

return leaderboard;

}
  