import { SerializedPuzzle } from "server/puzzles/decode-puzzle";
import { EloChange, PuzzleState } from "./puzzle-state";
import { Method, fetchServer2 } from "client/src/app/scripts/fetch-server";
import { DBUser } from "server/database/user-queries";


export class RatedPuzzleState extends PuzzleState {
  

  private eloChange!: EloChange;
  private eloHistory: number[] = [];

  constructor(
    private readonly username: string,
  ) {
    super();
  }

  override async init(): Promise<void> {

    const user = await fetchServer2<DBUser>(Method.GET, `/api/v2/user${this.username}`);
    console.log("User", user);

    // TODO: fetch the user's current puzzle elo from the server
    this.eloHistory.push(user.puzzleElo);
    console.log("Starting elo", user.puzzleElo);
  }

  protected override onSubmitPuzzle(isCorrect: boolean, isRetry: boolean): void {

    // do not update elo on retry
    if (isRetry) return;

    const newElo = this.getElo() + (isCorrect ? this.eloChange.eloGain : -this.eloChange.eloLoss);
    this.eloHistory.push(newElo);
  }

  override async _fetchNextPuzzle(): Promise<SerializedPuzzle> {
    // TODO: fetch a rated puzzle from the server

    // TODO
    this.eloChange = {
      eloGain: 10,
      eloLoss: 5
    }

    return {} as SerializedPuzzle;
  }

  override getPuzzleName(): string {
    return "Rated Puzzle"
  }

  override getEloChange(): EloChange | undefined {
    return this.eloChange;
  }

  override isTimed(): boolean {
      return true;
  }

  override nextButtonText(): string | undefined {
      return "New Puzzle";
  }

  getElo() {
    return this.eloHistory[this.eloHistory.length - 1];
  }

  getEloHistory(): number[] {
    return this.eloHistory;
  }
}