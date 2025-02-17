import { DBPuzzle } from "src/app/shared/puzzles/db-puzzle";
import { EngineMove, PuzzleSolution } from "./puzzle-strategy";
import MoveableTetromino from "src/app/shared/tetris/moveable-tetromino";

// Convert DBPuzzle from server to the more useful PuzzleSolution schema
export function decodePuzzleSolution(dbPuzzle: DBPuzzle): PuzzleSolution {

    const getEngineMove = (current: number, next: number, score: string, guesses: number): EngineMove => {
        return {
        firstPlacement: MoveableTetromino.fromInt2(current),
        secondPlacement: MoveableTetromino.fromInt2(next),
        score: parseFloat(score),
        guesses: guesses,
        }
    };

    // Get the engine's recommendations from the puzzle solution
    return {
        rating: dbPuzzle.rating,
        moves: [
        getEngineMove(dbPuzzle.current_1, dbPuzzle.next_1, dbPuzzle.score_1, dbPuzzle.guesses_1),
        getEngineMove(dbPuzzle.current_2, dbPuzzle.next_2, dbPuzzle.score_2, dbPuzzle.guesses_2),
        getEngineMove(dbPuzzle.current_3, dbPuzzle.next_3, dbPuzzle.score_3, dbPuzzle.guesses_3),
        getEngineMove(dbPuzzle.current_4, dbPuzzle.next_4, dbPuzzle.score_4, dbPuzzle.guesses_4),
        getEngineMove(dbPuzzle.current_5, dbPuzzle.next_5, dbPuzzle.score_5, dbPuzzle.guesses_5),
        ]
    };

}