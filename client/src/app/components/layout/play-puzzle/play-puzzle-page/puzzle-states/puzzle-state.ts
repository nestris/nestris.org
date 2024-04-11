import { evaluatePuzzleSubmission } from "client/src/app/models/puzzles/evaluate-puzzle-submission";
import { PuzzleDefinition, PuzzleResult, PuzzleSubmission } from "client/src/app/models/puzzles/puzzle";
import { BehaviorSubject } from "rxjs";
import { SerializedPuzzle } from "server/puzzles/decode-puzzle";

export interface EloChange {
  eloGain: number;
  eloLoss: number;
}


export abstract class PuzzleState {

  protected currentPuzzle?: SerializedPuzzle;

  // should throw an error if not initialized properly
  abstract init(): Promise<void>;

  async fetchNextPuzzle(): Promise<SerializedPuzzle> {
    this.currentPuzzle = await this._fetchNextPuzzle();
    return this.currentPuzzle;
  }

  protected abstract _fetchNextPuzzle(): Promise<SerializedPuzzle>;

  abstract getPuzzleName(): string;
  abstract getEloChange(): EloChange | undefined;
  abstract isTimed(): boolean;
  abstract nextButtonText(): string | undefined; // string for button to go to next puzzle, or undefined if no button

  protected onSubmitPuzzle(isCorrect: boolean): void {}

  async submitPuzzle(submission: PuzzleSubmission, gaveUp: boolean): Promise<PuzzleResult> {
    
    const result = evaluatePuzzleSubmission(this.currentPuzzle!, submission, gaveUp);
    console.log("submitPuzzle", result);

    this.onSubmitPuzzle(result.isCorrect);

    // TODO: submit puzzle to server to update attempts / solves
    
    return result;
  }
}