import { PuzzleSubmission } from "src/app/models/puzzles/puzzle";
import { EngineMove, PuzzleSolution, PuzzleStrategy, UnsolvedPuzzle } from "./puzzle-strategy";
import { PuzzleStrategyType } from "./puzzle-strategy-type";
import { PuzzleRating } from "src/app/shared/puzzles/puzzle-rating";
import { DBPuzzle } from "src/app/shared/puzzles/db-puzzle";

export class RatedPuzzleStrategy extends PuzzleStrategy {
  public readonly type = PuzzleStrategyType.RATED;
  public readonly isTimed = true;
  public readonly nextButtonText = "Next Puzzle";
  public readonly displayName = "Rated Puzzle";

  public override async fetchNextPuzzle(): Promise<UnsolvedPuzzle> {
    // Fetch the next puzzle from the server

    // This is a placeholder
    return { puzzleID: "", level: 18 };
  }

  public override async submitPuzzle(submission: PuzzleSubmission): Promise<PuzzleSolution> {
    // Submit the user's solution to the server and return the engine's recommendations

    // This is a placeholder
    return {
      rating: PuzzleRating.FIVE_STAR,
      moves: []
    }
  }

  public getRatedPuzzle(): DBPuzzle {
    // TODO
    throw new Error("Method not implemented.");
  }

  public getEloHistory(): number[] {
    // TODO
    return [];
  }
}