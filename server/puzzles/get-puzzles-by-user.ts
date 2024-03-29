import { Request, Response } from 'express';
import { queryDB } from '../database';
import { SerializedPuzzle, decodePuzzleFromDB } from './decode-puzzle';

// get all puzzles created by a user specified by url param
export async function getPuzzlesByUserRoute(req: Request, res: Response) {

  const username = req.params['username'];

  const result = await getPuzzlesByUser(username);

  res.status(200).send(result);
}

export async function getPuzzlesByUser(username: string): Promise<SerializedPuzzle[]> {

  const result = await queryDB("SELECT * FROM puzzles WHERE creator = $1", [username]);

  return result.rows.map((puzzle) => decodePuzzleFromDB(puzzle));
}