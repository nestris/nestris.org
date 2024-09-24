import { Request, Response } from 'express';
import { queryDB } from '../database';
import { decodeRatedPuzzleFromDB } from '../puzzle-generation/decode-rated-puzzle';

// GET puzzle from database with matching id, return GenericPuzzle
export async function getPuzzleRoute(req: Request, res: Response) {

    const puzzleID = req.params['id'];
    if (!puzzleID) {
        res.status(400).send("No puzzleID provided");
        return;
    }

    let result = await queryDB(
        `SELECT * FROM rated_puzzles WHERE id = $1`,
        [puzzleID]
    );

    if (result.rows.length === 0) {
        res.status(404).send("Puzzle not found");
        return;
    }
    
    const puzzle = decodeRatedPuzzleFromDB(result.rows[0]);
    res.status(200).send(puzzle);

}