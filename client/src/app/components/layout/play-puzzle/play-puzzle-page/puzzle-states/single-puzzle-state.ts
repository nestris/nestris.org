import { SerializedPuzzle } from "server/puzzles/decode-puzzle";
import { EloChange, PuzzleState } from "./puzzle-state";
import { Method, fetchServer2 } from "client/src/app/scripts/fetch-server";

export class SinglePuzzleState extends PuzzleState {

  private fetchedPuzzle!: SerializedPuzzle;

  constructor(private readonly puzzleID: string) {
    super();
  }

  override async init(): Promise<void> {
    this.fetchedPuzzle = await fetchServer2<SerializedPuzzle>(Method.GET, `/api/v2/puzzle/${this.puzzleID}`);
  }

  override async _fetchNextPuzzle(): Promise<SerializedPuzzle> {
    return this.fetchedPuzzle;
  }

  override getPuzzleName(): string {
    return `${this.currentPuzzle!.creator}'s Puzzle`;
  }

  override getEloChange(): EloChange | undefined {
    return undefined;
  }

  override isTimed(): boolean {
      return false;
  }

  override nextButtonText(): string | undefined {
      return undefined;
  }
}