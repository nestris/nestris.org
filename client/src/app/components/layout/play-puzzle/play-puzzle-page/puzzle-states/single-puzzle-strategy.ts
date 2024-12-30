import { decodePuzzle } from "src/app/shared/puzzles/encode-puzzle";
import { EngineMove, PuzzleSolution, PuzzleStrategy, UnsolvedPuzzle } from "./puzzle-strategy";
import { PuzzleStrategyType } from "./puzzle-strategy-type";
import { v4 as uuidv4 } from 'uuid';
import { PuzzleSubmission } from "src/app/models/puzzles/puzzle";
import { computeEngineMoves } from "./compute-engine-moves";
import { PuzzleRating } from "src/app/shared/puzzles/puzzle-rating";

export class SinglePuzzleStrategy extends PuzzleStrategy {
  public readonly type = PuzzleStrategyType.SINGLE;
  public readonly isTimed = false;
  public readonly nextButtonText = undefined;
  public readonly displayName = "Shared Puzzle";

  public async fetchNextPuzzle(): Promise<UnsolvedPuzzle> {
    const puzzleID = this.paramMap.get('id') ?? undefined;
    if (!puzzleID) throw new Error('No puzzle ID provided');

    console.log('Fetching solo puzzle', puzzleID);

    // TODO: try to fetch the puzzle from the server to get guess stats

    // Puzzle is directly encoded in the URL
    return { puzzleID, level: 18 };
  }

  // Calculate engine moves client-side and return them
  public async submitPuzzle(puzzleID: string, submission: PuzzleSubmission): Promise<PuzzleSolution> {
    return {
      rating: PuzzleRating.UNRATED,
      moves: await computeEngineMoves(this.stackrabbitService, puzzleID, 18)
    }
  }
}