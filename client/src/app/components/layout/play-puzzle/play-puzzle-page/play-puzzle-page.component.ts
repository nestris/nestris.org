import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { PuzzleSubmission } from 'client/src/app/models/puzzles/puzzle';
import { BehaviorSubject, Subject } from 'rxjs';
import { EloMode } from '../elo-rating/elo-rating.component';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { ActivatedRoute, Router } from '@angular/router';
import { SerializedPuzzle } from 'server/puzzles/decode-puzzle';
import { EloChange, PuzzleState } from './puzzle-states/puzzle-state';
import { SinglePuzzleState } from './puzzle-states/single-puzzle-state';
import { FolderPuzzleState } from './puzzle-states/folder-puzzle-state';
import { RatedPuzzleState } from './puzzle-states/rated-puzzle-state';
import MoveableTetromino from 'network-protocol/tetris/moveable-tetromino';
import { TetrisBoard } from 'network-protocol/tetris/tetris-board';
import { BinaryTranscoder } from 'network-protocol/tetris-board-transcoding/binary-transcoder';
import { Move } from '../../../modals/create-puzzle-modal/create-puzzle-modal.component';
import { getTopMovesHybrid } from 'client/src/app/scripts/stackrabbit-decoder';
import { InputSpeed } from 'network-protocol/models/input-speed';

export enum PuzzleMode {
  RATED = "rated",
  FOLDER = "folder",
  SINGLE = "single"
}
@Component({
  selector: 'app-play-puzzle-page',
  templateUrl: './play-puzzle-page.component.html',
  styleUrls: ['./play-puzzle-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayPuzzlePageComponent implements OnInit {

  readonly PUZZLE_TIME_LIMIT = 30;

  puzzleState!: PuzzleState;

  puzzle$ = new BehaviorSubject<SerializedPuzzle | undefined>(undefined);
  eloChange$ = new BehaviorSubject<EloChange | undefined>(undefined);

  canUndo$ = new BehaviorSubject<boolean>(false);
  clickUndo$ = new Subject<void>();

  // if true, in the process of solving puzzle. if false, showing puzzle solution
  solvingPuzzle$ = new BehaviorSubject<boolean>(true);
  puzzleIsCorrect = false;
  puzzleSolutionExplanation: string = "";

  moveRecommendations$ = new BehaviorSubject<Move[]>([]);
  public hoveredMove$ = new BehaviorSubject<Move | undefined>(undefined);

  public currentPuzzleTime$ = new BehaviorSubject<number>(0);
  private startPuzzleTime?: number;
  private timerInterval: any;

  readonly EloMode = EloMode;
  readonly ButtonColor = ButtonColor;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {
  }

  // for when URL is invalid, redirect to default puzzle URL (rated puzzle)
  redirectToDefaultURL() {
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
    const mode = this.route.snapshot.queryParamMap.get('mode') as PuzzleMode;
    const id = this.route.snapshot.queryParamMap.get('id');

    // if mode is not valid, redirect to default puzzle URL
    if (!Object.values(PuzzleMode).includes(mode)) {
      this.redirectToDefaultURL();
      return;
    }

    // if mode is folder or single, but id is not provided, redirect to default puzzle URL
    if ((mode === PuzzleMode.FOLDER || mode === PuzzleMode.SINGLE) && !id) {
      this.redirectToDefaultURL();
      return;
    }

    switch (mode) {
      case PuzzleMode.RATED:
        this.puzzleState = new RatedPuzzleState();
        break;
      case PuzzleMode.FOLDER:
        this.puzzleState = new FolderPuzzleState(id!);
        break;
      case PuzzleMode.SINGLE:
        this.puzzleState = new SinglePuzzleState(id!);
        break;
    }

    await this.puzzleState.init();

    await this.startPuzzle();
  }

  async generateMoveRecommendations(puzzle: SerializedPuzzle) {

    console.log("Generating move recommendations");

    const board = BinaryTranscoder.decode(puzzle.board);
    const response = await getTopMovesHybrid(board, 18, 0, puzzle.currentPiece, puzzle.nextPiece, InputSpeed.HZ_30);
    
    console.log("GEnerated");
    this.moveRecommendations$.next(response.nextBox);
  }

  hoverEngineMove(move: Move | undefined) {
    this.hoveredMove$.next(move);
  }


  // fetch a new puzzle from the server, start puzzle, and start timer
  async startPuzzle() {


    const puzzle = await this.puzzleState.fetchNextPuzzle();

    // start fetching move generations. no need to wait for this to finish
    this.generateMoveRecommendations(puzzle);

    this.puzzle$.next(puzzle);
    this.eloChange$.next(this.puzzleState.getEloChange());
    
    if (this.puzzleState.isTimed()) {
      this.startTimer();
    }

    this.solvingPuzzle$.next(true);
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
    await this.submitPuzzle(submission, true);
  }

  // submit puzzle and go to puzzle solution page
  async submitPuzzle(submission: PuzzleSubmission, gaveUp: boolean = false) {

    // stop timer
    clearInterval(this.timerInterval);

    // submit puzzle to server
    const result = await this.puzzleState.submitPuzzle(submission, gaveUp);
    this.puzzleIsCorrect = result.isCorrect;
    this.puzzleSolutionExplanation = result.explanation;

    // go to puzzle solution page
    this.solvingPuzzle$.next(false);

  }
  

  getBoard(): TetrisBoard {
    const puzzle = this.puzzle$.getValue()!;
    return BinaryTranscoder.decode(puzzle.board);
  }

  getCurrentMT(): MoveableTetromino {
    const puzzle = this.puzzle$.getValue()!;
    return new MoveableTetromino(puzzle.currentPiece, puzzle.r1, puzzle.x1, puzzle.y1);
  }

  getNextMT(): MoveableTetromino {
    const puzzle = this.puzzle$.getValue()!;
    return new MoveableTetromino(puzzle.nextPiece, puzzle.r2, puzzle.x2, puzzle.y2);
  }

  getRatedPuzzleState(): RatedPuzzleState | undefined {
    if (this.puzzleState instanceof RatedPuzzleState) return this.puzzleState;
    return undefined;
  }

  exitUnratedPuzzle() {
    this.router.navigate(["/puzzles/view"]);
  }

}
