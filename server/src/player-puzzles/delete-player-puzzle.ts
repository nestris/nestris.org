import { Request, Response } from 'express';
import { queryDB } from '../database';
import { QueryResult } from 'pg';

export async function deletePlayerPuzzleRoute(req: Request, res: Response) {

  const id = req.params['puzzle'];
  try {
    const result = await deletePlayerPuzzleFromDatabase(id);
    res.status(200).send(result);
  }
  catch (error) {
    res.status(500).send(error);
  }
}

export async function deletePlayerPuzzleFromDatabase(id: string): Promise<QueryResult> {
  
  const result = await queryDB("DELETE FROM player_puzzles WHERE id = $1", [id]);
  return result;
}
