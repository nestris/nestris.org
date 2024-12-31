import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, map } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { PuzzleSubmission } from 'src/app/models/puzzles/puzzle';
import { NotificationService } from 'src/app/services/notification.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { EloMode } from '../elo-rating/elo-rating.component';
import { NotificationAutohide, NotificationType } from 'src/app/shared/models/notifications';
import { PuzzleRating } from 'src/app/shared/puzzles/puzzle-rating';
import { FetchService } from 'src/app/services/fetch.service';
import { MeService } from 'src/app/services/state/me.service';
import { DBPuzzle } from 'src/app/shared/puzzles/db-puzzle';
import { decodePuzzle } from 'src/app/shared/puzzles/encode-puzzle';
import { PuzzleStrategyType } from './puzzle-states/puzzle-strategy-type';
import { EloChange, EngineMove, PuzzleSolution, PuzzleStrategy, UnsolvedPuzzle } from './puzzle-states/puzzle-strategy';
import { puzzleStrategyFactory } from './puzzle-states/puzzle-strategy-factory';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';
import { StackrabbitService } from 'src/app/services/stackrabbit/stackrabbit.service';
import { RatedPuzzleStrategy } from './puzzle-states/rated-puzzle-strategy';
import { SinglePuzzleStrategy } from './puzzle-states/single-puzzle-strategy';
import { PUZZLE_THEME_TEXT } from 'src/app/shared/puzzles/puzzle-theme';
import { getDisplayKeybind } from 'src/app/components/ui/editable-keybind/editable-keybind.component';

const RIGHT_ANSWER_COMMENTS = [
  "You got it!",
  "Stack-tastic!",
  "Superb solving!",
  "Bullseye!",
  "Sharp as a tack!",
  "Nailed it with style!"
]

const WRONG_ANSWER_COMMENTS = [
  "Good try! This puzzle's a toughie.",
  "Not quite, but you got the next one!",
  "Back to the drawing board!",
  "Left your brain in bed today?",
  "Not even close, but A for effort!",
  "Was that a wild guess?",
  "If that was a dart, you missed the board.",
  "Try again, Einstein.",
  "Feeling puzzled?",
  "Is your GPS off today?",
  "Your accuracy's on vacation.",
  "I guess perfection's too mainstream for you.",
  "Whoops, better luck next time!"
]

enum PuzzleStateID {
  SOLVING = "SOLVING",
  SOLUTION = "SOLUTION"
}

// Represents all the data needed to display a puzzle in SOLVING state
export interface PuzzleData {
  puzzleID: string,
  board: TetrisBoard,
  current: TetrominoType,
  next: TetrominoType,
  level: number,
  eloChange?: EloChange // if undefined, puzzle is unrated
}

// Represents the full state of the puzzle page
interface PuzzleState {
  id: PuzzleStateID,
  data?: PuzzleData, // undefined if still loading
  isRetry: boolean,
  solution?: PuzzleSolution, // undefined if not yet submitted or still loading
  submission?: PuzzleSubmission, // undefined if not yet submitted
  submissionIndex?: number, // number from -1 to 4 indicating which engine move corresponds to the user's submission
  comment?: string, // comment to display to the user after submitting
}

@Component({
  selector: 'app-play-puzzle-page',
  templateUrl: './play-puzzle-page.component.html',
  styleUrls: ['./play-puzzle-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayPuzzlePageComponent implements OnInit {

  readonly getDisplayKeybind = getDisplayKeybind;
  readonly EloMode = EloMode;
  readonly ButtonColor = ButtonColor;
  readonly PUZZLE_THEME_TEXT = PUZZLE_THEME_TEXT;

  readonly PUZZLE_TIME_LIMIT = 30;
  readonly PuzzleStrategyType = PuzzleStrategyType;
  readonly PuzzleRating = PuzzleRating;
  readonly State = PuzzleStateID;

  public strategy!: PuzzleStrategy;

  // undefined means still loading
  public state$ = new BehaviorSubject<PuzzleState | undefined>(undefined);

  // Emits when the user clicks the undo button
  public clickUndo$ = new Subject<void>();

  // Set by puzzle component to indicate whether the user is allowed to undo
  public canUndo$ = new BehaviorSubject<boolean>(false);

  // The engine move that the user is currently hovering over
  public hoveredMove$ = new BehaviorSubject<EngineMove | undefined>(undefined);

  // The fraction of time that has passed in the puzzle to be displayed in the timer bar
  public currentPuzzleTime$ = new BehaviorSubject<number>(0);

  private timerInterval?: any;

  public rotateLeftKeybind = 'z';
  public rotateRightKeybind = 'x';


  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private notifier: NotificationService,
    private injector: Injector,
    private me: MeService,
  ) {}


  async ngOnInit() {

    // Update keybinds based on user settings
    const me = this.me.getSync();
    if (me) {
      this.rotateLeftKeybind = me.keybind_puzzle_rot_left
      this.rotateRightKeybind = me.keybind_puzzle_rot_right
    }

    // 'mode' query parameter determines the puzzle strategy
    const params = this.route.snapshot.queryParamMap;
    const mode = params.get('mode') as PuzzleStrategyType;

    // Create puzzle strategy based on mode
    const strategy = puzzleStrategyFactory(mode, this.injector, params);
    if (!strategy) { // If invalid mode, redirect to home
      console.error("Invalid puzzle mode:", mode);
      this.router.navigate(['/']);
      return;
    }
    this.strategy = strategy;

    // Fetch the first puzzle
    await this.fetchNextPuzzle();
  }

  public async fetchNextPuzzle() {

    // Clear the timer and hovered move
    this.currentPuzzleTime$.next(0);
    this.hoveredMove$.next(undefined);

    // Set state to loading the SOLVING state
    this.state$.next({ id: PuzzleStateID.SOLVING, isRetry: false });

    // Fetch the next puzzle and decode the board and pieces
    let puzzle: UnsolvedPuzzle;
    let board: TetrisBoard;
    let current: TetrominoType;
    let next: TetrominoType;
    try {

      puzzle = await this.strategy.fetchNextPuzzle();
      ({ board, current, next } = decodePuzzle(puzzle.puzzleID));

    } catch (e) {
      // If fetch fails, redirect to home
      console.error(e);
      this.notifier.notify(NotificationType.ERROR, "You are already in a puzzle!");

      // Redirect to home
      this.router.navigate(['/']);
      return;
    }

    // Update the state with the new puzzle data
    this.state$.next({
      id: PuzzleStateID.SOLVING,
      isRetry: false,
      data: { puzzleID: puzzle.puzzleID, board, current, next, level: puzzle.level, eloChange: puzzle.eloChange },
    });

    // Start the timer if the puzzle is timed
    if (this.strategy.isTimed) this.startTimer();
  }

  private startTimer() {

    const startPuzzleTime = Date.now();

    // start timer
    this.timerInterval = setInterval(() => {

      let time = (Date.now() - startPuzzleTime) / 1000;

      // stop timer and submit puzzle if time limit is reached
      if (time >= this.PUZZLE_TIME_LIMIT) {
        this.submitPuzzle(); // submit puzzle early
      }

      this.currentPuzzleTime$.next(time);
    }, 20);
  }

  getRatedPuzzleStrategy(): RatedPuzzleStrategy | undefined {
    if (this.strategy instanceof RatedPuzzleStrategy) return this.strategy;
    return undefined;
  }

  getSinglePuzzleStrategy(): SinglePuzzleStrategy | undefined {
    if (this.strategy instanceof SinglePuzzleStrategy) return this.strategy;
    return undefined;
  }

  async submitPuzzle(submission: PuzzleSubmission = {firstPiece: undefined, secondPiece: undefined}) {
    const currentState = this.state$.getValue();
    if (!currentState) throw new Error('Puzzle state is undefined when submitting puzzle');
    if (!currentState.data) throw new Error('Puzzle data is undefined when submitting puzzle');

    clearInterval(this.timerInterval);

    // If this is retrying, do not resubmit the puzzle
    let solution: PuzzleSolution;
    if (currentState.isRetry) {
      if (!currentState.solution) throw new Error('Puzzle solution is undefined when retrying puzzle');
      solution = currentState.solution;
    } else {
      // Submit the puzzle based on the strategy
      solution = await this.strategy.submitPuzzle(currentState.data.puzzleID, submission);
    }

    // Check which submission index corresponds to the user's submission
    let submissionIndex = -1;
    if (submission.firstPiece && submission.secondPiece) {
      for (let i = 0; i < solution.moves.length; i++) {

        if (
          solution.moves[i].firstPlacement.equals(submission.firstPiece) &&
          solution.moves[i].secondPlacement.equals(submission.secondPiece)
        ) {
          submissionIndex = i;
          break;
        }
      }
    }

    const comment = (
      submissionIndex === 0 ?
      RIGHT_ANSWER_COMMENTS[Math.floor(Math.random() * RIGHT_ANSWER_COMMENTS.length)] :
      WRONG_ANSWER_COMMENTS[Math.floor(Math.random() * WRONG_ANSWER_COMMENTS.length)]
    );

    this.state$.next({ id: PuzzleStateID.SOLUTION, isRetry: currentState.isRetry, data: currentState.data, solution, submission, submissionIndex, comment });
  }

  // Go back to solving state but keep the same puzzle and solution as retry
  retryPuzzle() {
    const currentState = this.state$.getValue();
    if (!currentState) throw new Error('Puzzle state is undefined when retrying puzzle');
    if (!currentState.data) throw new Error('Puzzle data is undefined when retrying puzzle');

    this.state$.next({ id: PuzzleStateID.SOLVING, isRetry: true, data: currentState.data, solution: currentState.solution });
  }


  // Copy the puzzle link to the clipboard
  copyPuzzleLink(puzzleID: string | undefined) {
    if (!puzzleID) return;

    const url = window.location.origin + `/online/puzzle?mode=single&id=${puzzleID}`;
    navigator.clipboard.writeText(url);
    this.notifier.notify(NotificationType.SUCCESS, "Puzzle link copied to clipboard!");
  }

  async onExit() {
    console.log("Exiting puzzle");

    // if in the middle of submitting puzzle, submit first 
    if (this.state$.getValue()?.id === PuzzleStateID.SOLVING) {
      await this.submitPuzzle(); // submit puzzle early
    }
  }

}
