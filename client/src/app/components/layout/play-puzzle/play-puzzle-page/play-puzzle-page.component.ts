import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Host, HostListener, OnInit } from '@angular/core';
import { PuzzleDefinition, PuzzleSubmission } from 'client/src/app/models/puzzles/puzzle';
import { TabID } from 'client/src/app/models/tabs';
import { PuzzleService as PuzzleService } from 'client/src/app/services/puzzle.service';
import { RoutingService } from 'client/src/app/services/routing.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { EloMode } from '../elo-rating/elo-rating.component';

@Component({
  selector: 'app-play-puzzle-page',
  templateUrl: './play-puzzle-page.component.html',
  styleUrls: ['./play-puzzle-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayPuzzlePageComponent implements OnInit {

  readonly PUZZLE_TIME_LIMIT = 30;

  puzzle$ = new BehaviorSubject<PuzzleDefinition | undefined>(undefined);

  canUndo$ = new BehaviorSubject<boolean>(false);
  clickUndo$ = new Subject<void>();

  // if true, in the process of solving puzzle. if false, showing puzzle solution
  solvingPuzzle$ = new BehaviorSubject<boolean>(true);
  puzzleIsCorrect = false;
  puzzleSolutionExplanation: string = "";

  public currentPuzzleTime$ = new BehaviorSubject<number>(0);
  private startPuzzleTime?: number;
  private timerInterval: any;

  readonly EloMode = EloMode;

  constructor(
    private routingService: RoutingService,
    public puzzleService: PuzzleService,
  ) {
  }

  async ngOnInit() {
    await this.startNewPuzzle();
  }

  exitFullscreen() {
    // go back to previous tab. if no previous tab, go to home
    const lastTab = this.routingService.getLastTab() ?? TabID.HOME;
    console.log("exitFullscreen", lastTab);
    this.routingService.setSelectedTab({tab: lastTab, params: undefined});
  }

  // fetch a new puzzle from the server, start puzzle, and start timer
  async startNewPuzzle() {
    this.puzzle$.next(undefined);
    this.puzzle$.next(await this.puzzleService.fetchPuzzle());
    this.startTimer();
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

  // submit puzzle and go to puzzle solution page
  async submitPuzzle(submission: PuzzleSubmission) {

    // stop timer
    clearInterval(this.timerInterval);

    // submit puzzle to server
    const result = await this.puzzleService.submitPuzzle(this.puzzle$.getValue()!, submission);
    this.puzzleIsCorrect = result.isCorrect;
    this.puzzleSolutionExplanation = result.explanation;

    // go to puzzle solution page
    this.solvingPuzzle$.next(false);
  }

}
