import { PuzzleRating } from "./puzzle-rating";
import { PuzzleTheme } from "./puzzle-theme";


export interface DBPuzzleBuilder {
    id: string;
    current_1: number;
    next_1: number;
    current_2: number;
    next_2: number;
    current_3: number;
    next_3: number;
    current_4: number;
    next_4: number;
    current_5: number;
    next_5: number;
    theme: PuzzleTheme;   
    rating: PuzzleRating;
}

export const NUM_DB_PUZZLE_PARAMS = 13;

export interface DBPuzzle extends DBPuzzleBuilder {
    created_at: string;
    guesses_1: number;
    guesses_2: number;
    guesses_3: number;
    guesses_4: number;
    guesses_5: number;
    num_attempts: number;
    num_solves: number;
    num_likes: number;
    num_dislikes: number;
}


export interface UnsolvedRatedPuzzle {
    attemptID: string;
    puzzleID: string;
    eloGain: number;
    eloLoss: number;
}