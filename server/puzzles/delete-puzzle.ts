import { Request, Response } from 'express';
import { queryDB } from '../database';
import { SerializedPuzzle, decodePuzzleFromDB } from './decode-puzzle';
import { QueryResult } from 'pg';

export async function deletePuzzleRoute(req: Request, res: Response) {

  const id = req.params['puzzle'];
  try {
    const result = await deletePuzzleFromDatabase(id);
    res.status(200).send(result);
  }
  catch (error) {
    res.status(500).send(error);
  }
}

export async function deletePuzzleFromDatabase(id: string): Promise<QueryResult> {
  
  const result = await queryDB("DELETE FROM puzzles WHERE id = $1", [id]);
  return result;
}
