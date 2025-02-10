import { PuzzleSubmission } from "src/app/models/puzzles/puzzle";
import { EngineMove, PuzzleSolution, PuzzleStrategy, UnsolvedPuzzle } from "./puzzle-strategy";
import { PuzzleStrategyType } from "./puzzle-strategy-type";
import { DBPuzzle } from "src/app/shared/puzzles/db-puzzle";
import { FetchService, Method } from "src/app/services/fetch.service";
import { WebsocketService } from "src/app/services/websocket.service";
import { RatedPuzzleResult, RatedPuzzleSubmission, UnsolvedRatedPuzzle } from "src/app/shared/puzzles/rated-puzzle";
import MoveableTetromino from "src/app/shared/tetris/moveable-tetromino";

export class RatedPuzzleStrategy extends PuzzleStrategy {
  public readonly type = PuzzleStrategyType.RATED;
  public readonly isTimed = true;
  public readonly nextButtonText = "Next Puzzle";
  public readonly displayName = "Rated Puzzle";

  private fetchService = this.injector.get(FetchService);
  private websocketService = this.injector.get(WebsocketService);

  private currentPuzzle?: DBPuzzle;
  private startTime = Date.now();

  private eloHistory: number[] = [];

  public override async fetchNextPuzzle(): Promise<UnsolvedPuzzle> {

    // Fetch the next puzzle from the server
    const sessionID = this.websocketService.getSessionID();
    const puzzle = await this.fetchService.fetch<UnsolvedRatedPuzzle>(Method.POST, `/api/v2/rated-puzzle/request/${sessionID}`);

    // If elo history is empty, set initial value
    if (this.eloHistory.length === 0) {
      this.eloHistory.push(puzzle.startElo);
    }

    this.startTime = Date.now();

    return {
      puzzleID: puzzle.id,
      level: 18, // Rated puzzles always start at level 18
      eloChange: {
        startElo: puzzle.startElo,
        eloGain: puzzle.eloGain,
        eloLoss: puzzle.eloLoss,
      }
    };
  }

  // Submit the user's solution to the server and return the engine's recommendations
  public override async submitPuzzle(puzzleID: string, submission: PuzzleSubmission): Promise<PuzzleSolution> {

    const ratedPuzzleSubmission: RatedPuzzleSubmission = {
      puzzleID: puzzleID,
      seconds: (Date.now() - this.startTime) / 1000,
      current: submission.firstPiece?.getInt2(),
      next: submission.secondPiece?.getInt2()
    };

    // Submit the user's solution to the server
    const { puzzle: dbPuzzle, newElo } = await this.fetchService.fetch<RatedPuzzleResult>(Method.POST, `/api/v2/rated-puzzle/submit`, ratedPuzzleSubmission);
    this.currentPuzzle = dbPuzzle;

    // update the user's elo history
    this.eloHistory.push(newElo);

    const getEngineMove = (current: number, next: number, score: string): EngineMove => {
      return {
        firstPlacement: MoveableTetromino.fromInt2(current),
        secondPlacement: MoveableTetromino.fromInt2(next),
        score: parseFloat(score)
      }
    };
    
    // Get the engine's recommendations from the puzzle solution
    return {
      rating: dbPuzzle.rating,
      moves: [
        getEngineMove(dbPuzzle.current_1, dbPuzzle.next_1, dbPuzzle.score_1),
        getEngineMove(dbPuzzle.current_2, dbPuzzle.next_2, dbPuzzle.score_2),
        getEngineMove(dbPuzzle.current_3, dbPuzzle.next_3, dbPuzzle.score_3),
        getEngineMove(dbPuzzle.current_4, dbPuzzle.next_4, dbPuzzle.score_4),
        getEngineMove(dbPuzzle.current_5, dbPuzzle.next_5, dbPuzzle.score_5),
      ]
    }
  }

  public getRatedPuzzle(): DBPuzzle {
    return this.currentPuzzle!;
  }

  public getEloHistory(): number[] {
    return this.eloHistory;
  }
}