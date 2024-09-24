import { PuzzleRating } from "./puzzle-rating";

// the stats for a player for all the puzzles they have attempted
export interface AttemptStats {
  puzzlesAttempted: number;
  puzzlesSolved: number;
  averageSolveDuration: number;

  successRateForRating: {[key in PuzzleRating]?: number | null};
}

export enum TimePeriod {
  LIFETIME = "LIFETIME",
  THIS_WEEK = "THIS_WEEK",
  TODAY = "TODAY",
}