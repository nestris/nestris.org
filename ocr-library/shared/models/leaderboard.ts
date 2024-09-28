export interface PuzzleLeaderboardRow {
    username: string;
    userid: string;
    rating: number;
    best: number;
    puzzlesSolved: number;
    solveRate: number;
    avgPuzzleRating: number;
}

export interface PuzzleLeaderboard {
    rows: PuzzleLeaderboardRow[];
}