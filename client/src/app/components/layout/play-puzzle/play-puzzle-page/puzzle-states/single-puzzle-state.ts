import { fetchServer2, Method } from "src/app/scripts/fetch-server";
import { GenericPuzzle } from "src/app/shared/puzzles/generic-puzzle";
import { PuzzleState, EloChange } from "./puzzle-state";
import { PuzzleState as PuzzleStateEnum } from "src/app/shared/puzzles/rated-puzzle"; 
import { RatedPuzzle } from "src/app/shared/puzzles/rated-puzzle";
import { decodePuzzle } from "src/app/shared/puzzles/encode-puzzle";
import { BinaryTranscoder } from "src/app/shared/network/tetris-board-transcoding/binary-transcoder";
import { getTopMovesHybrid } from "src/app/scripts/stackrabbit-decoder";
import { InputSpeed } from "src/app/shared/models/input-speed";
import { PuzzleRating } from "src/app/shared/puzzles/puzzle-rating";
import { NotificationService } from "src/app/services/notification.service";
import { NotificationType } from "src/app/shared/models/notifications";

export class SinglePuzzleState extends PuzzleState {
  
  private puzzle!: RatedPuzzle;

  constructor(
    private readonly puzzleID: string,
    private notificationService: NotificationService,
  ) {
    super();
  }

  // Fetch the puzzle from puzzleID, or throw an error if the puzzle does not exist
  async init() {
    // This throws an error if the puzzle does not exist
    console.log("Fetching single puzzle", this.puzzleID);
    try {
      this.puzzle = await fetchServer2<RatedPuzzle>(Method.GET, `/api/v2/puzzle/${this.puzzleID}`);
    } catch (e: any) {
      console.log("Puzzle not found, recreating from puzzleID");
      this.puzzle = await this.getPuzzleFromID(this.puzzleID);
    }
  }

  async getPuzzleFromID(puzzleID: string): Promise<RatedPuzzle> {

    this.notificationService.notify(NotificationType.INFO, "Loading puzzle...");

    const decodedPuzzle = decodePuzzle(puzzleID);

    const topMoves = await getTopMovesHybrid(decodedPuzzle.board, 18, 0, decodedPuzzle.current, decodedPuzzle.next, InputSpeed.HZ_30);
    const firstPlacement = topMoves.nextBox[0].firstPlacement;
    const secondPlacement = topMoves.nextBox[0].secondPlacement;

    return {
      id: puzzleID,
      boardString: BinaryTranscoder.encode(decodedPuzzle.board),
      current: decodedPuzzle.current,
      next: decodedPuzzle.next,
      r1: firstPlacement.getRotation(),
      x1: firstPlacement.getTranslateX(),
      y1: firstPlacement.getTranslateY(),
      r2: secondPlacement.getRotation(),
      x2: secondPlacement.getTranslateX(),
      y2: secondPlacement.getTranslateY(),
      rating: PuzzleRating.UNRATED,
      theme: undefined,
      numAttempts: 0,
      numSolves: 0,
      likes: 0,
      dislikes: 0,
      state: PuzzleStateEnum.PROVISIONAL,
    }

  }

  protected async _fetchNextPuzzle(): Promise<RatedPuzzle> {
    return this.puzzle;
  }

  getPuzzleName(isRetry: boolean): string {
    return "Shared Puzzle";
  }

  override getPuzzle(): RatedPuzzle {
    return this.puzzle;
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