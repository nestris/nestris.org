import { Request, Response } from 'express';
import { queryDB } from '../database';
import { decodePlayerPuzzleFromDB } from './decode-player-puzzle';
import { PlayerPuzzle } from '../../shared/puzzles/player-puzzle';

export async function getPlayerPuzzleRoute(req: Request, res: Response) {

  const id = req.params['puzzle'];
  try {
    const puzzle = await getPlayerPuzzleFromDatabase(id);

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

export async function getPlayerPuzzleFromDatabase(id: string): Promise<PlayerPuzzle | undefined> {
  
  try {
    const result = await queryDB("SELECT * FROM player_puzzles WHERE id = $1", [id]);
    return decodePlayerPuzzleFromDB(result.rows[0]);
  } catch (error) {
    return undefined;
  }
}
