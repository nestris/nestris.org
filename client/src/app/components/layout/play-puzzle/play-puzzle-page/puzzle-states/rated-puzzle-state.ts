import { fetchServer2, Method } from "src/app/scripts/fetch-server";
import { GenericPuzzle } from "src/app/shared/puzzles/generic-puzzle";
import { PUZZLE_THEME_TEXT } from "src/app/shared/puzzles/puzzle-theme";
import { RatedPuzzle } from "src/app/shared/puzzles/rated-puzzle";
import { SerializedPuzzleSubmission, PuzzleResult, evaluatePuzzleSubmission } from "src/app/shared/puzzles/serialized-puzzle-submission";
import { PuzzleState, EloChange } from "./puzzle-state";
import { DBUser } from "src/app/shared/models/db-user";

export class RatedPuzzleState extends PuzzleState {
  

  private eloChange!: EloChange;
  private eloHistory: number[] = [];

  constructor(
    private readonly userid: number,
  ) {
    super();
  }

  override async init(): Promise<void> {

    const user = await fetchServer2<DBUser>(Method.GET, `/api/v2/user/${this.userid}`);
    console.log("User", user);

    // TODO: fetch the user's current puzzle elo from the server
    this.eloHistory.push(user.puzzleElo);
    console.log("Starting elo", user.puzzleElo);
  }


  override async evaluatePuzzleSubmission(puzzle: GenericPuzzle, submission: SerializedPuzzleSubmission, isRetry: boolean): Promise<PuzzleResult> {
    // if retrying, just evaluate the submission client-side
    if (isRetry) return evaluatePuzzleSubmission(puzzle, submission);

    submission.userid = this.userid;
    const puzzleResult = await fetchServer2<PuzzleResult>(Method.POST, `/api/v2/submit-puzzle-attempt`, submission);

    this.eloHistory.push(puzzleResult.resultingElo!);
    return puzzleResult;
  }

  override async _fetchNextPuzzle(): Promise<GenericPuzzle> {
    
    // fetch a rated puzzle from the server
    const puzzle = await fetchServer2<RatedPuzzle>(Method.POST, `/api/v2/random-rated-puzzle/${this.userid}`);

    this.eloChange = {
      eloGain: puzzle.eloGain!,
      eloLoss: puzzle.eloLoss!
    }

    return puzzle;
  }

  override getPuzzleName(isRetry: boolean): string {
    return isRetry ? "Retry Puzzle" : "Rated Puzzle"
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

  getPuzzle(): RatedPuzzle {
    return this.currentPuzzle! as RatedPuzzle;
  }

  getPuzzleID(): string {
    return this.getPuzzle().id;
  }

  getThemeString(): string {
    const theme = this.getPuzzle().theme;
    if (theme === undefined) return "Unknown";
    return PUZZLE_THEME_TEXT[theme];
  }

  getSuccessRate(): string {
    if (this.getPuzzle().numAttempts === 0) return "-";
    return `${(this.getPuzzle().numSolves / this.getPuzzle().numAttempts * 100).toFixed(0)}%`;
  }

}