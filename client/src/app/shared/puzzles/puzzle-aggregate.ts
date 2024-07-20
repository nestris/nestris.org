import { PuzzleRating } from "./puzzle-rating";


export interface PuzzleAggregate {
  ratings: {
      rating: PuzzleRating,
      numPuzzles: number,
      totalAttempts: number,
      totalSolves: number
  }[];
}