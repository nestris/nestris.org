import { PlayerPuzzle, PuzzleFolder } from "network-protocol/puzzles/player-puzzle";
import { EloChange, PuzzleState } from "./puzzle-state";
import { Method, fetchServer2 } from "client/src/app/scripts/fetch-server";

export class FolderPuzzleState extends PuzzleState {

  private folder!: PuzzleFolder;
  private currentPuzzleIndex = -1;

  constructor(private readonly folderID: string) {
    super();
  }

  override async init(): Promise<void> {
    this.folder = await fetchServer2<PuzzleFolder>(Method.GET, `/api/v2/folder/${this.folderID}`);
  }

  override async _fetchNextPuzzle(): Promise<PlayerPuzzle> {

    this.currentPuzzleIndex++;
    return this.folder.puzzles[this.currentPuzzleIndex];
  }

  override getPuzzleName(isRetry: boolean): string {
    return `${this.folder.name} (${this.currentPuzzleIndex + 1}/${this.folder.puzzles.length})`;
  }

  override getEloChange(): EloChange | undefined {
    return undefined;
  }

  override isTimed(): boolean {
      return false;
  }

  override nextButtonText(): string | undefined {

    // if no puzzles left, return undefined
    if (this.currentPuzzleIndex + 1 === this.folder.puzzles.length) return undefined;

    // return i.e. "Next Puzzle (2/5)"
    return `Next Puzzle (${this.currentPuzzleIndex + 2}/${this.folder.puzzles.length})`;
  }
}