import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, map } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { PuzzleSubmission } from 'src/app/models/puzzles/puzzle';
import { getTopMovesHybrid } from 'src/app/scripts/stackrabbit-decoder';
import { NotificationService } from 'src/app/services/notification.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { InputSpeed } from 'src/app/shared/models/input-speed';
import { BinaryTranscoder } from 'src/app/shared/network/tetris-board-transcoding/binary-transcoder';
import { GenericPuzzle } from 'src/app/shared/puzzles/generic-puzzle';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { EloMode } from '../elo-rating/elo-rating.component';
import { PuzzleState, EloChange } from './puzzle-states/puzzle-state';
import { RatedPuzzleState } from './puzzle-states/rated-puzzle-state';
import { SinglePuzzleState } from './puzzle-states/single-puzzle-state';
import { NotificationAutohide, NotificationType } from 'src/app/shared/models/notifications';
import { RatedPuzzle } from 'src/app/shared/puzzles/rated-puzzle';
import { PuzzleRating } from 'src/app/shared/puzzles/puzzle-rating';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { PuzzleGuesses } from 'src/app/shared/puzzles/puzzle-guess';

export enum PuzzleMode {
  RATED = "rated",
  SINGLE = "single",
}

export interface Move {
  firstPlacement: MoveableTetromino;
  secondPlacement: MoveableTetromino;
  score: number;
  guesses?: number;
}

@Component({
  selector: 'app-play-puzzle-page',
  templateUrl: './play-puzzle-page.component.html',
  styleUrls: ['./play-puzzle-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayPuzzlePageComponent implements OnInit {

  readonly PUZZLE_TIME_LIMIT = 30;
  readonly PuzzleMode = PuzzleMode;
  readonly PuzzleRating = PuzzleRating;

  mode$ = new BehaviorSubject<PuzzleMode | undefined>(undefined);

  puzzleState$ = new BehaviorSubject<PuzzleState | undefined>(undefined);

  puzzle$ = new BehaviorSubject<RatedPuzzle | undefined>(undefined);
  eloChange$ = new BehaviorSubject<EloChange | undefined>(undefined);

  canUndo$ = new BehaviorSubject<boolean>(false);
  clickUndo$ = new Subject<void>();

  // if true, in the process of solving puzzle. if false, showing puzzle solution
  solvingPuzzle$ = new BehaviorSubject<boolean>(true);
  puzzleIsCorrect = false;
  puzzleSolutionExplanation: string = "";

  loadingNextPuzzle$ = new BehaviorSubject<boolean>(false);
  loadingSubmitPuzzle$ = new BehaviorSubject<boolean>(false);

  moveRecommendations$ = new BehaviorSubject<Move[]>([]);
  public hoveredMove$ = new BehaviorSubject<Move | undefined>(undefined);

  public currentPuzzleTime$ = new BehaviorSubject<number>(0);
  private startPuzzleTime?: number;
  private timerInterval: any;

  public isRetry$ = new BehaviorSubject<boolean>(false);

  readonly EloMode = EloMode;
  readonly ButtonColor = ButtonColor;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notifier: NotificationService,
    private websocketService: WebsocketService
  ) {
  }

  // for when URL is invalid, redirect to default puzzle URL (rated puzzle)
  redirectToDefaultURL() {

    // if not logged in, redirect back to puzzles page
    if (!this.websocketService.isSignedIn()) {
      this.router.navigate(['/puzzles/']);
      return;
    }

    this.router.navigate(['/online/puzzle'], {
      queryParams: {
        mode: "rated", 
        exit: this.route.snapshot.queryParamMap.get('exit')
      },
    });
  }

  async ngOnInit() {

    /* get query parameters

    mode:
    - "rated" - fetch a random rated puzzle from server 
    - "folder" - unrated puzzles from a specific folder id
    - "single" - unrated puzzle with specific id

    id:
    - id of folder or puzzle
    */

    this.route.queryParamMap.subscribe(async (param) => {
      const mode = param.get('mode') as PuzzleMode;
      const id = param.get('id'); 

      console.log("Mode:", mode);
      console.log("ID:", id);

      // if mode is not valid, redirect to default puzzle URL
      if (!Object.values(PuzzleMode).includes(mode)) {
        console.log("Invalid mode");
        this.redirectToDefaultURL();
        return;
      }

      // if mode is rated and not logged in, redirect back to puzzles page
      if (mode === PuzzleMode.RATED && !this.websocketService.isSignedIn()) {
        console.log("Not logged in");
        this.router.navigate(['/puzzles/']);
        return;
      }

      console.log("Creating puzzle state");
      let puzzleState: PuzzleState;

      switch (mode) {
        case PuzzleMode.RATED:
          // guaranteed to be logged in
          puzzleState = new RatedPuzzleState(this.websocketService.getUserID()!);
          console.log("Rated puzzle state created");
          break;
        case PuzzleMode.SINGLE:
          if (!id) {
            console.log("Invalid id");
            this.redirectToDefaultURL();
            return;
          }
          puzzleState = new SinglePuzzleState(id, this.notifier);
          console.log("Single puzzle state created");
          break;
      }

      console.log("Puzzle state created");

      try {
        await puzzleState.init();
        this.mode$.next(mode);
        this.puzzleState$.next(puzzleState);
        console.log("Puzzle state initialized");
      } catch (e) {

        if (mode === PuzzleMode.SINGLE) {
          this.notifier.notify(NotificationType.ERROR, "Puzzle not found", NotificationAutohide.LONG);
        }

        console.log("Error initializing puzzle state:", e);
        this.redirectToDefaultURL();
        return;
      }

      await this.startPuzzle();
    });
  }

  confirmString(solvingPuzzle: boolean, isRetry: boolean): string | undefined {

    if (this.puzzleState$.getValue() instanceof RatedPuzzleState) {
      if (solvingPuzzle && !isRetry) return "Are you sure you want to exit? You will lose elo for this puzzle.";
      else return undefined;
    }

    return undefined;
  }

  async generateMoveRecommendations(puzzle: GenericPuzzle) {

    console.log("Generating move recommendations");
    this.moveRecommendations$.next([]);

    const board = BinaryTranscoder.decode(puzzle.boardString);
    try {

      // get top moves from stackrabbit, and guesses from server
      const topMovesHybridPromise = getTopMovesHybrid(board, 18, 0, puzzle.current, puzzle.next, InputSpeed.HZ_30);
      const guessesPromise = fetchServer2<PuzzleGuesses>(Method.GET, `/api/v2/puzzle-guesses/${puzzle.id}`);
      const [response, guesses] = await Promise.all([topMovesHybridPromise, guessesPromise]);

      // Calculate the number of guesses for each move
      const moves: Move[] = response.nextBox;
      for (let move of moves) {
        for (let guess of guesses.guesses) {
          if (move.firstPlacement.getInt2() == guess.currentPlacement && move.secondPlacement.getInt2() == guess.nextPlacement) {
            move.guesses = guess.numGuesses;
            break;
          }
        }
      }

      this.moveRecommendations$.next(moves);
      console.log("Move recommendations generated");
    } catch (e) {
      console.error("Error generating move recommendations", e);
      this.moveRecommendations$.next([]);
    };
    
  }

  hoverEngineMove(move: Move | undefined) {
    this.hoveredMove$.next(move);
  }


  // fetch a new puzzle from the server, start puzzle, and start timer
  async startPuzzle() {

    // if not signed in, redirect back to puzzles page
    if (this.puzzleState$.getValue() instanceof RatedPuzzleState && !this.websocketService.isSignedIn()) {
      this.router.navigate(['/puzzles/']);
      return;
    }

    // if already loading next puzzle, return
    if (this.loadingNextPuzzle$.getValue()) return;
    this.loadingNextPuzzle$.next(true);

    const puzzle = await this.puzzleState$.getValue()!.fetchNextPuzzle();

    // start fetching move generations. no need to wait for this to finish
    this.generateMoveRecommendations(puzzle);

    this.canUndo$.next(false);
    this.puzzle$.next(puzzle);
    this.hoverEngineMove(undefined);
    this.eloChange$.next(this.puzzleState$.getValue()!.getEloChange());
    
    if (this.puzzleState$.getValue()!.isTimed()) {
      this.startTimer();
    }

    this.isRetry$.next(false);
    this.solvingPuzzle$.next(true);
    this.loadingNextPuzzle$.next(false);
  }

  private startTimer() {
    this.startPuzzleTime = Date.now();

    // start timer
    this.currentPuzzleTime$.next(0);

    // start timer
    this.timerInterval = setInterval(() => {
      let time = (Date.now() - this.startPuzzleTime!) / 1000;

      // submit puzzle if time limit is reached
      if (time >= this.PUZZLE_TIME_LIMIT) {
        this.submitPuzzle({firstPiece: undefined, secondPiece: undefined});
      }

      this.currentPuzzleTime$.next(time);

    }, 20);
  }

  // when undo button is clicked, emit clickUndo$, which will send an event to the puzzle board to undo the first piece placement
  undo() {
    this.clickUndo$.next();
  }

  async submitPuzzleEarly() {
    const submission: PuzzleSubmission = {
      firstPiece: undefined,
      secondPiece: undefined
    };
    await this.submitPuzzle(submission);
  }

  // submit puzzle and go to puzzle solution page
  async submitPuzzle(submission: PuzzleSubmission) {

    // if already loading submit puzzle, return
    if (this.loadingSubmitPuzzle$.getValue()) return;
    this.loadingSubmitPuzzle$.next(true);

    // stop timer
    clearInterval(this.timerInterval);

    // if not signed in, redirect back to puzzles page
    if (this.puzzleState$.getValue() instanceof RatedPuzzleState && !this.websocketService.isSignedIn()) {
      this.router.navigate(['/puzzles/']);
      return;
    }

    // submit puzzle to server
    const result = await this.puzzleState$.getValue()!.submitPuzzle(submission, this.isRetry$.getValue());
    this.puzzleIsCorrect = result.isCorrect;
    this.puzzleSolutionExplanation = result.explanation;

    // go to puzzle solution page
    this.solvingPuzzle$.next(false);
    this.loadingSubmitPuzzle$.next(false);
  }
  

  getBoard(): TetrisBoard {
    const puzzle = this.puzzle$.getValue()!;
    return BinaryTranscoder.decode(puzzle.boardString);
  }

  // get the submitted first piece
  getCurrentMT(): MoveableTetromino | undefined {
    return this.puzzleState$.getValue()!.getSubmission()?.firstPiece;
  }

  // get the submitted second piece
  getNextMT(): MoveableTetromino | undefined {
    return this.puzzleState$.getValue()!.getSubmission()?.secondPiece;
  }

  getRatedPuzzleState$(): Observable<RatedPuzzleState | undefined> {
    return this.puzzleState$.pipe(map(state => {
      if (state instanceof RatedPuzzleState) {
        return state;
      }
      return undefined;
    }));
  }

  exitUnratedPuzzle() {
    this.router.navigate(["/puzzles"]);
  }

  retryPuzzle() {

    this.isRetry$.next(true);

    if (this.puzzleState$.getValue()!.isTimed()) {
      this.startTimer();
    }

    this.solvingPuzzle$.next(true);
  }

  copyPuzzleLink() {
    const puzzle = this.puzzle$.getValue()!;
    const url = window.location.origin + `/online/puzzle?mode=single&id=${puzzle.id}`;
    navigator.clipboard.writeText(url);
    this.notifier.notify(NotificationType.SUCCESS, "Puzzle link copied to clipboard!");
  }

  async onExit() {
    console.log("Exiting puzzle");

    // if in the middle of submitting rated puzzle, submit first 
    if (this.solvingPuzzle$.getValue() && this.puzzleState$.getValue() instanceof RatedPuzzleState) {
      await this.submitPuzzleEarly();
    }
  }

}
