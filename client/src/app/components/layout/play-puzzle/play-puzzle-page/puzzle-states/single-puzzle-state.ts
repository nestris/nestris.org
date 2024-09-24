import { fetchServer2, Method } from "src/app/scripts/fetch-server";
import { GenericPuzzle } from "src/app/shared/puzzles/generic-puzzle";
import { PuzzleState, EloChange } from "./puzzle-state";
import { DBUser } from "src/app/shared/models/db-user";

export class SinglePuzzleState extends PuzzleState {
  
  private puzzle!: GenericPuzzle;

  constructor(
    private readonly puzzleID: string,
  ) {
    super();
  }

  // Fetch the puzzle from puzzleID, or throw an error if the puzzle does not exist
  async init() {
    // This throws an error if the puzzle does not exist
    this.puzzle = await fetchServer2<GenericPuzzle>(Method.GET, `/api/v2/puzzle/${this.puzzleID}`);
  }

  protected async _fetchNextPuzzle(): Promise<GenericPuzzle> {
    return this.puzzle;
  }

  getPuzzleName(isRetry: boolean): string {
    return "Unrated Puzzle";
  }

  // Single puzzles do not have elo changes
  getEloChange(): EloChange | undefined {
    return undefined;
  }

  // Single puzzles are not timed
  isTimed(): boolean {
    return false;
  }

  // No button to go to next puzzle for single puzzles
  nextButtonText(): string | undefined {
    return undefined;
  }

}