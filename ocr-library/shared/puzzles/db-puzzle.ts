import { PuzzleRating } from "./puzzle-rating";
import { PuzzleTheme } from "./puzzle-theme";


export interface DBPuzzleBuilder {
    id: string;
    current_1: number;
    next_1: number;
    score_1: string;
    current_2: number;
    next_2: number;
    score_2: string;
    current_3: number;
    next_3: number;
    score_3: string;
    current_4: number;
    next_4: number;
    score_4: string;
    current_5: number;
    next_5: number;
    score_5: string;
    theme: PuzzleTheme;   
    rating: PuzzleRating;
}

export const NUM_DB_PUZZLE_BUILDER_PARAMS = 18;

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