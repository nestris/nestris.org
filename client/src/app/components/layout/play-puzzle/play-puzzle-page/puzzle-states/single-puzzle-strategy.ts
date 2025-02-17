import { PuzzleSolution, PuzzleStrategy, UnsolvedPuzzle } from "./puzzle-strategy";
import { PuzzleStrategyType } from "./puzzle-strategy-type";
import { PuzzleSubmission } from "src/app/models/puzzles/puzzle";
import { computeEngineMoves } from "./compute-engine-moves";
import { PuzzleRating } from "src/app/shared/puzzles/puzzle-rating";
import { StackrabbitService } from "src/app/services/stackrabbit/stackrabbit.service";
import { FetchService, Method } from "src/app/services/fetch.service";
import { DBPuzzle } from "src/app/shared/puzzles/db-puzzle";
import { decodePuzzleSolution } from "./decode-puzzle-solution";

export class SinglePuzzleStrategy extends PuzzleStrategy {
  public readonly type = PuzzleStrategyType.SINGLE;
  public readonly isTimed = false;
  public readonly nextButtonText = undefined;
  public readonly displayName = "Shared Puzzle";

  private fetchService = this.injector.get(FetchService);
  private stackrabbitService = this.injector.get(StackrabbitService);

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

    
    try {
      // Try to fetch the puzzle by id, if it exists, to get the guesses
      const dbPuzzle = await this.fetchService.fetch<DBPuzzle>(Method.GET, `/api/v2/rated-puzzle/get/${puzzleID}`);
      console.log("Fetched puzzle solution from db");
      return decodePuzzleSolution(dbPuzzle);
    } catch {
      // Fetch failure probably means puzzle doesn't exist in database. As fallback, use WASM engine, defaulting guesses to 0
      console.log("Failed to fetch puzzle solution from db, using WASM engine fallback");
      return {
        rating: PuzzleRating.UNRATED,
        moves: await computeEngineMoves(this.stackrabbitService, puzzleID, 18)
      }
    }
    

    
  }
}