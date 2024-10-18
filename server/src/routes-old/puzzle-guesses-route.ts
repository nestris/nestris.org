import { Request, Response } from 'express';
import { queryDB } from '../database-old';
import { PuzzleGuess, PuzzleGuesses } from '../../shared/puzzles/puzzle-guess';

export async function getPuzzleGuessesRoute(req: Request, res: Response) {

    // must re-encode as middleware automatically decodes
    const puzzleID = req.params['id'];
    
    const query = `
        SELECT 
            current_placement,
            next_placement,
            COUNT(*) as num_attempts
        FROM 
            puzzle_attempts
        WHERE 
            puzzle_id = $1
        GROUP BY 
            current_placement, next_placement
        ORDER BY 
            num_attempts DESC, current_placement, next_placement;`;

    let result: any;
    try {
        result = await queryDB(query, [puzzleID]);

        console.log(puzzleID, result.rows);

        const guesses: PuzzleGuess[] = result.rows.map((row: any) => {
            return {
            currentPlacement: parseInt(row.current_placement),
            nextPlacement: parseInt(row.next_placement),
            numGuesses: parseInt(row.num_attempts)
        }});

        const puzzleGuesses: PuzzleGuesses = {
            puzzleID: puzzleID,
            guesses: guesses
        };

        res.status(200).send(puzzleGuesses);

    } catch (error) {
        res.status(500).send(`Failed to get puzzle guesses for puzzle ${puzzleID}, error: ${error}`);
        return;
    }
}