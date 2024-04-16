import { evaluatePuzzleSubmission } from "client/src/app/models/puzzles/evaluate-puzzle-submission";
import { PuzzleDefinition, PuzzleResult, PuzzleSubmission } from "client/src/app/models/puzzles/puzzle";
import { GenericPuzzle } from "network-protocol/puzzles/generic-puzzle";
import { PlayerPuzzle } from "network-protocol/puzzles/player-puzzle";

export interface EloChange {
  eloGain: number;
  eloLoss: number;
}


export abstract class PuzzleState {

  protected currentPuzzle?: GenericPuzzle;
  private submission?: PuzzleSubmission;

  // should throw an error if not initialized properly
  abstract init(): Promise<void>;

  async fetchNextPuzzle(): Promise<GenericPuzzle> {
    this.currentPuzzle = await this._fetchNextPuzzle();
    return this.currentPuzzle;
  }

  protected abstract _fetchNextPuzzle(): Promise<GenericPuzzle>;

  abstract getPuzzleName(): string;
  abstract getEloChange(): EloChange | undefined;
  abstract isTimed(): boolean;
  abstract nextButtonText(): string | undefined; // string for button to go to next puzzle, or undefined if no button

  protected onSubmitPuzzle(isCorrect: boolean, isRetry: boolean): void {}

  async submitPuzzle(submission: PuzzleSubmission, gaveUp: boolean, isRetry: boolean): Promise<PuzzleResult> {

    this.submission = submission;
    
    const result = evaluatePuzzleSubmission(this.currentPuzzle!, submission, gaveUp);
    console.log("submitPuzzle", result);

    this.onSubmitPuzzle(result.isCorrect, isRetry);

    // TODO: submit puzzle to server to update attempts / solves
    
    return result;
  }

  getSubmission(): PuzzleSubmission | undefined {
    return this.submission;
  }
}