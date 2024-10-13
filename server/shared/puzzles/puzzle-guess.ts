export interface PuzzleGuess {
    currentPlacement: number;
    nextPlacement: number;
    numGuesses: number;
}

export interface PuzzleGuesses {
    puzzleID: string;
    guesses: PuzzleGuess[];
}