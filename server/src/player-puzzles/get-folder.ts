import { Request, Response } from 'express';
import { PuzzleFolder } from '../../shared/puzzles/player-puzzle';

export async function getFolderRoute(req: Request, res: Response) {

  const id = req.params['folder'];
  try {
    const folder = await getFolderFromDatabase(id);
    res.status(200).send(folder);
  }
  catch (error) {
    res.status(500).send(error);
  }
}

export async function getFolderFromDatabase(id: string): Promise<PuzzleFolder> {
  
  // TODO
  return {} as PuzzleFolder;
}
