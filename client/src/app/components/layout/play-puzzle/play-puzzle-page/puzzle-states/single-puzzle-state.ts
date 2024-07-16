import { fetchServer2, Method } from "src/app/scripts/fetch-server";
import { PlayerPuzzle } from "src/app/shared/puzzles/player-puzzle";
import { PuzzleState, EloChange } from "./puzzle-state";


export class SinglePuzzleState extends PuzzleState {

  private fetchedPuzzle!: PlayerPuzzle;

  constructor(private readonly puzzleID: string) {
    super();
  }

  override async init(): Promise<void> {
    this.fetchedPuzzle = await fetchServer2<PlayerPuzzle>(Method.GET, `/api/v2/puzzle/${this.puzzleID}`);
  }

  override async _fetchNextPuzzle(): Promise<PlayerPuzzle> {
    return this.fetchedPuzzle;
  }

  override getPuzzleName(isRetry: boolean): string {
    return `${(this.currentPuzzle! as PlayerPuzzle).creator}'s Puzzle`;
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