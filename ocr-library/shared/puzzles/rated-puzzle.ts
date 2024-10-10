import { GenericPuzzle } from "./generic-puzzle";
import { PuzzleRating } from "./puzzle-rating";
import { PuzzleTheme } from "./puzzle-theme";

export enum PuzzleState {
  PROVISIONAL = "provisional",
  ADJUSTED = "adjusted",
}


export interface RatedPuzzle extends GenericPuzzle {
  rating: PuzzleRating;
  theme: PuzzleTheme | undefined;
  numAttempts: number;
  numSolves: number;
  eloGain?: number;
  eloLoss?: number;
  userElo?: number;
  likes: number;
  dislikes: number;
  state: PuzzleState;
}
