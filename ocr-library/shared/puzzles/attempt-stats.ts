import { PuzzleRating } from "./puzzle-rating";

export interface AttemptStatsForRating {
  rating: PuzzleRating;
  attempts: number;
  successRate: number | null;
}

// the stats for a player for all the puzzles they have attempted
export interface AttemptStats {
  puzzlesAttempted: number;
  puzzlesSolved: number;
  averageSolveDuration: number;

  attemptStatsForRating: {[key in PuzzleRating]?: AttemptStatsForRating};
}

export enum TimePeriod {
  LIFETIME = "LIFETIME",
  THIS_WEEK = "THIS_WEEK",
  TODAY = "TODAY",
}