import { Request, Response } from 'express';
import { queryDB } from '../database';
import { SerializedPuzzle, decodePuzzleFromDB } from './decode-puzzle';

export async function getPuzzleRoute(req: Request, res: Response) {

  const id = req.params['puzzle'];
  try {
    const puzzle = await getPuzzleFromDatabase(id);
    res.status(200).send(puzzle);
  }
  catch (error) {
    res.status(500).send(error);
  }
}

export async function getPuzzleFromDatabase(id: string): Promise<SerializedPuzzle> {
  
  const result = await queryDB("SELECT * FROM puzzles WHERE id = $1", [id]);
  return decodePuzzleFromDB(result.rows[0]);
}
