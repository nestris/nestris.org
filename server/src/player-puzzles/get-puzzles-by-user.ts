import { Request, Response } from 'express';
import { queryDB } from '../database';
import { decodePlayerPuzzleFromDB } from './decode-player-puzzle';
import { PlayerPuzzle } from '../../shared/puzzles/player-puzzle';

// get all puzzles created by a user specified by url param
export async function getPlayerPuzzlesByUserRoute(req: Request, res: Response) {

  const username = req.params['username'];

  const result = await getPlayerPuzzlesByUser(username);

  res.status(200).send(result);
}

export async function getPlayerPuzzlesByUser(username: string): Promise<PlayerPuzzle[]> {

  // sort by creation date
  const result = await queryDB("SELECT * FROM player_puzzles WHERE creator = $1 ORDER BY created_at DESC", [username]);

  return result.rows.map((puzzle) => decodePlayerPuzzleFromDB(puzzle));
}