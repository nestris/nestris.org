import { SerializedPuzzle } from "server/puzzles/decode-puzzle";
import { EloChange, PuzzleState } from "./puzzle-state";


export class RatedPuzzleState extends PuzzleState {
  

  private eloChange!: EloChange;
  private eloHistory: number[] = [];

  override async init(): Promise<void> {
    // TODO: fetch the user's current puzzle elo from the server
    this.eloHistory.push(1000);
  }

  protected override onSubmitPuzzle(isCorrect: boolean): void {
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