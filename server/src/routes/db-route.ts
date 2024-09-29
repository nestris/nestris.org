import { Request, Response } from 'express';
import { queryDB } from '../database';

export async function getUserCountRoute(req: Request, res: Response) {

  const query = `
    SELECT COUNT(*) as users
    FROM users;
  `;

  const result = await queryDB(query, []);
  const count = result.rows[0].users;

  res.send({ count });
}

export async function getPuzzlesSolvedRoute(req: Request, res: Response) {

  const query = `
    SELECT COUNT(*) as puzzles_solved
    FROM puzzle_attempts
    WHERE is_correct = true;
  `;

  const result = await queryDB(query, []);
  const count = result.rows[0].puzzles_solved;

  res.send({ count });
}

export async function getTotalPuzzleDuration(): Promise<{ total: number }> {

  const query = `
    SELECT SUM(solve_time) as total_puzzle_duration
    FROM puzzle_attempts;
  `;

  const result = await queryDB(query, []);
  const total = result.rows[0].total_puzzle_duration;

  return { total };
}