import { Request, Response } from 'express';
import { queryDB } from '../database';
import { SerializedPuzzle, decodePuzzleFromDB } from './decode-puzzle';

export async function getPuzzleRoute(req: Request, res: Response) {

  const id = req.params['puzzle'];
  try {
    const puzzle = await getPuzzleFromDatabase(id);

    if (!puzzle) {
      res.status(404).send("Puzzle not found");
      return;
    }

    res.status(200).send(puzzle);
  }
  catch (error) {
    res.status(500).send(error);
  }
}

export async function getPuzzleFromDatabase(id: string): Promise<SerializedPuzzle | undefined> {
  
  try {
    const result = await queryDB("SELECT * FROM puzzles WHERE id = $1", [id]);
    return decodePuzzleFromDB(result.rows[0]);
  } catch (error) {
    return undefined;
  }
}
