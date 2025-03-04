import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Host, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatestWith, debounceTime, distinct, distinctUntilChanged, filter, map, Observable, Subject, switchMap, tap } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { ButtonColor as SelectorColor } from 'src/app/components/ui/solid-selector/solid-selector.component';
import { ApiService } from 'src/app/services/api.service';
import { NotificationService } from 'src/app/services/notification.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { calculatePlacementScore, EVALUATION_ORDER, EVALUATION_TO_COLOR, EvaluationRating, overallAccuracyRating, placementScoreRating } from 'src/app/shared/evaluation/evaluation';
import { DBGame } from 'src/app/shared/models/db-game';
import { NotificationType } from 'src/app/shared/models/notifications';
import { MemoryGameStatus } from 'src/app/shared/tetris/memory-game-status';
import { addSignPrefix, numberWithCommas, timeAgo } from 'src/app/util/misc';
import { AnalysisPlacement, Frame, interpretPackets } from '../game-interpreter';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { BufferTranscoder } from 'src/app/shared/network/tetris-board-transcoding/buffer-transcoder';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { RateMoveResponse, StackrabbitService, TopMovesHybridResponse } from 'src/app/services/stackrabbit/stackrabbit.service';
import { SmartGameStatus } from 'src/app/shared/tetris/smart-game-status';
import { InputSpeed } from 'src/app/shared/models/input-speed';
import { RatedMove } from 'src/app/components/ui/eval-bar/eval-bar.component';


interface CurrentFrame {
  placementIndex: number;
  frameIndex: number;
}

interface RawRecommendation {
  firstPlacement: MoveableTetromino,
  secondPlacement?: MoveableTetromino,
  score: number,
}

interface Recommendation extends RawRecommendation {
  isActual: boolean;
  color: string;
}

enum RecommendationType {
  ENGINE_MOVE = 'Engine move',
  NO_NEXT_BOX = 'Without next piece',
}

interface RecommendationGroup {
  type: RecommendationType,
  hasNextBox: boolean,
  recommendations: Recommendation[]
}

interface StackRabbit {
  placementIndex: number,
  recommendations: RecommendationGroup[],
  ratedMove: RatedMove | null
}


const SPEEDS = [1, 2, 4, 0.5];
const ALL_INPUT_SPEEDS: InputSpeed[] = [InputSpeed.HZ_10, InputSpeed.HZ_12, InputSpeed.HZ_15, InputSpeed.HZ_20, InputSpeed.HZ_30];

@Component({
  selector: 'app-game-analysis',
  templateUrl: './game-analysis.component.html',
  styleUrls: ['./game-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameAnalysisComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('content') contentElement!: ElementRef;

  readonly ButtonColor = ButtonColor;
  readonly SelectorColor = SelectorColor;
  readonly timeAgo = timeAgo;
  readonly numberWithCommas = numberWithCommas;
  readonly addSignPrefix = addSignPrefix;
  readonly EVALUATION_ORDER = EVALUATION_ORDER;
  readonly EVALUATION_TO_COLOR = EVALUATION_TO_COLOR;

  // The HTTP request for game metadata
  public game?: DBGame;

  // The packets send through websocket interpreted into placements
  public placements?: AnalysisPlacement[];

  // Observable of when both game metadata and placements are received
  public loaded$ = new BehaviorSubject<boolean>(false);

  // Current frame and placement to display
  public current$ = new BehaviorSubject<CurrentFrame>({ placementIndex: 0, frameIndex: 0 });

  public currentPlacement$!: Observable<number>;
  public stackrabbit$!: Observable<StackRabbit>;

  public playing$ = new BehaviorSubject<boolean>(false);
  public hoveredRecommendation$ = new BehaviorSubject<Recommendation | null>(null);

  public speedIndex$ = new BehaviorSubject<number>(0);
  public speed$ = this.speedIndex$.pipe(
    map(index => SPEEDS[index]),
    tap(speed => this.speed = speed)
  );

  public speed: number = 1;

  private finalTimestampString: string = '';

  // Emphasize placement if paused and on the placement frame
  public emphasizePlacement$ = this.current$.pipe(
    combineLatestWith(this.playing$),
    map(([current, playing]) => {
      if (!this.placements) return false;
      if (playing) return false;

      const placementIndex = this.placements[current.placementIndex].placementFrameIndex;
      if (current.frameIndex !== placementIndex) return false;
      const { frame } = this.getCurrentFrame(current);
      return !frame.fullState;
    })
  );

  public isLimbo$ = this.current$.pipe(
    map(current => {
      const { frame } = this.getCurrentFrame(current);
      return frame.fullState !== undefined;
    })
  );

  // Terrible hack to make app-game-summary-graph component fit the width of content div
  public contentRect$ = new BehaviorSubject<DOMRect | null>(null);
  private resizeInterval: any;

  // Derive memory game status from placements
  public memoryGameStatus: MemoryGameStatus | null = null;

  public inputSpeedLabels = ALL_INPUT_SPEEDS.map(speed => `${speed.toString()}hz`);
  public inputSpeed$ = new BehaviorSubject<InputSpeed>(InputSpeed.HZ_30);
  public inputSpeedIndex$ = this.inputSpeed$.pipe(
    map(speed => ALL_INPUT_SPEEDS.indexOf(speed)),
  );

  public highlightMove$ = new BehaviorSubject<boolean>(true);
  public showEngineMove$ = new BehaviorSubject<boolean>(false);
  
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly websocketService: WebsocketService,
    private readonly apiService: ApiService,
    private readonly notificationService: NotificationService,
    private readonly stackrabbitService: StackrabbitService,
  ) {
  }

  
  async ngOnInit() {

    // Used for analysis
    this.currentPlacement$ = this.current$.pipe(
      map(current => {
        if (!this.placements) return 0;
        if (current.placementIndex === 0) return 0;
        return current.placementIndex;
      }),
      distinctUntilChanged(),
      debounceTime(50) // rate-limit to prevent spamming SR analysis
    );

    this.stackrabbit$ = this.currentPlacement$.pipe(
      combineLatestWith(this.loaded$, this.inputSpeed$), // on load, start evaluating
      filter(([placementIndex, loaded, inputSpeed]) => loaded),
      distinctUntilChanged(),
      tap(([placementIndex, loaded, inputSpeed]) => console.log("SR", placementIndex, loaded, inputSpeed)),
      switchMap(([placementIndex, loaded, inputSpeed]) => this.getStackrabbit(placementIndex, inputSpeed)),
      tap(() => this.hoveredRecommendation$.next(null)) // clear hovered recommendation
    );

    // this.stackrabbit$.subscribe(analysis => console.log('Stackrabbit analysis', analysis));
    // this.hoveredRecommendation$.subscribe(recommendation => console.log('Hovered recommendation', recommendation));

    // Wait for log in
    await this.websocketService.waitForSignIn();

    // Start listening for game data
    this.websocketService.setPacketGroupContainsPrefix(false);
    const startGameData = Date.now();
    const gameDataSubscription = this.websocketService.onPacketGroup().subscribe((packetGroup) => {

      // Ensure player index is not defined
      if (packetGroup.playerIndex !== undefined) throw new Error('Player index should not be defined');

      // Interpret the packets into placements
      console.log('Received game data in', Date.now() - startGameData, 'ms', packetGroup.packets);
      const { placements, status, totalMs } = interpretPackets(packetGroup.packets);
      this.memoryGameStatus = status;
      this.placements = placements;
      this.finalTimestampString = this.msToTimestamp(totalMs);

      console.log('Interpreted packets', placements);
      console.log('Memory game status', status);

      if (this.game) this.loaded$.next(true);

      // Stop listening for game data
      gameDataSubscription.unsubscribe();
    });

    // Fetch the game
    const sessionID = this.websocketService.getSessionID();
    const gameID = this.route.snapshot.paramMap.get('id');
    const startFetchGame = Date.now();

    if (!gameID) {
      this.notificationService.notify(NotificationType.ERROR, 'No game ID provided');
      this.router.navigate(['/review']);
      return;
    }

    // Fetch the game metadata
    try {

      const game = await this.apiService.getGame(gameID, sessionID);
      console.log('Game metadata', game, 'fetched in', Date.now() - startFetchGame, 'ms');
      this.game = game;

      if (this.placements) this.loaded$.next(true);

    } catch (error: any) {

      // If error code is 410, the game has been deleted
      const message = (error.status === 410) ? 'Replay file for this game has expired' : 'There was an error fetching the game';
      this.notificationService.notify(NotificationType.ERROR, message);
    
      this.router.navigate(['/review']);
    }
  }

  setInputSpeedIndex(index: number) {
    this.inputSpeed$.next(ALL_INPUT_SPEEDS[index] as InputSpeed);
  }

  getAccuracyColor(accuracy: number): string {
    return EVALUATION_TO_COLOR[overallAccuracyRating(accuracy)];
  }

  toggleSpeed() {
    const index = this.speedIndex$.getValue();
    this.speedIndex$.next((index + 1) % SPEEDS.length);
  }

  stopPlaying() {
    this.playing$.next(false);
  }

  // Play the game from the current frame. If recursive is true, keep playing until paused
  play(recursive: boolean = false) {
    if (recursive && !this.playing$.getValue()) return;
    if (!recursive) this.hoveredRecommendation$.next(null); // clear hovered recommendation
    this.playing$.next(true);

    // If recursive, advance to the next frame
    if (recursive) {

      if (!this.nextFrame()) {
        this.stopPlaying();
        return;
      }
    }
 
    // Get the delta of the next frame to find the time to wait
    const next = this.incrementCurrent(this.current$.getValue());
    if (next == null) {
      this.stopPlaying();
      return;
    }
    let msToWait = this.placements![next.placementIndex].frames[next.frameIndex].delta / this.speed;
    setTimeout(() => this.play(true), msToWait);
  }

  previousFrame(): boolean {

    let current = this.current$.getValue();

    // Reached the beginning of the game
    if (current.placementIndex === 0 && current.frameIndex === 0) {
      return false;
    }

    // Reached the end of the placement
    if (current.frameIndex === 0) {
      current = { placementIndex: current.placementIndex - 1, frameIndex: this.placements![current.placementIndex - 1].frames.length - 1 };
    } else { // Advance to the previous frame in the placement
      current = { placementIndex: current.placementIndex, frameIndex: current.frameIndex - 1 };
    }
    this.current$.next(current);
    return true;
  }

  private incrementCurrent(current: CurrentFrame): CurrentFrame | null {

    // Reached the end of the game
    if (current.placementIndex === this.placements!.length - 1 && current.frameIndex === this.placements![current.placementIndex].frames.length - 1) {
      return null;
    }

    if (current.frameIndex === this.placements![current.placementIndex].frames.length - 1) {
      return { placementIndex: current.placementIndex + 1, frameIndex: 0 };
    } else {
      return { placementIndex: current.placementIndex, frameIndex: current.frameIndex + 1 };
    }
  }

  nextFrame(debug: boolean = false): boolean {
    let current = this.current$.getValue();
    const next = this.incrementCurrent(current);

    if (next == null) return false;
    this.current$.next(next);

    if (debug) console.log(this.getCurrentFrame(next).frame);

    return true;
  }

  // Navigate to the previous placement at the frame index that matches piece lock
  previousPlacement(): boolean {
    const current = this.current$.getValue();
    if (current.placementIndex === 0) return false;
    const index = Math.max(0, current.placementIndex - (this.playing$.getValue() ? 2 : 1));
    this.current$.next({
      placementIndex: index,
      frameIndex: this.placements![index].placementFrameIndex
    });

    
    return true;
  }

  nextPlacement(): boolean {
    const current = this.current$.getValue();
    if (current.placementIndex === this.placements!.length - 1) return false;

    const placementFrameIndex = this.placements![current.placementIndex].placementFrameIndex;
    if (current.frameIndex < placementFrameIndex) {
      this.current$.next({
        placementIndex: current.placementIndex,
        frameIndex: placementFrameIndex
      });
    } else {
      this.current$.next({
        placementIndex: current.placementIndex + 1,
        frameIndex: this.placements![current.placementIndex + 1].placementFrameIndex
      });
    }
    return true;
  }

  goToStart(): void {
    this.current$.next({ placementIndex: 0, frameIndex: 0 });
  }

  goToEnd(): void {
    const index = this.placements!.length - 1;
    this.current$.next({
      placementIndex: index,
      frameIndex: this.placements![index].frames.length - 1
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {

    if (!this.loaded$.getValue()) return;

    if (event.key === 'ArrowLeft') this.previousPlacement();
    else if (event.key === 'ArrowRight') this.nextPlacement();
    else if (event.key === ",") this.previousFrame();
    else if (event.key === ".") this.nextFrame(true);
    else if (event.key === " ") {
      if (this.playing$.getValue()) this.stopPlaying();
      else this.play();
    }

    // if number key, go to that part of the game
    else if (event.key.match(/[0-9]/)) {
      if (!this.placements) return;
      const percent = parseInt(event.key) / 9;
      const placement = Math.floor((this.placements.length - 1) * percent);
      this.current$.next({ placementIndex: placement, frameIndex: percent === 0 ? 0 : this.placements[placement].placementFrameIndex });
      console.log('Go to', percent, placement);
    }
  }

  ngAfterViewInit(): void {
    
    // the shittiest monkeypatch ever to make app-game-summary-graph component fit the width of content div
    this.resizeInterval = setInterval(() => {
      if (this.contentElement === undefined) return;
      const rect = this.contentElement.nativeElement.getBoundingClientRect();
      if (rect.width !== this.contentRect$.getValue()?.width) {
        this.onResize();
      }
    }, 200);
  }

  clickPlacement(placementIndex: number): void {
    this.current$.next({ placementIndex, frameIndex: this.placements![placementIndex].placementFrameIndex });
  }

  // Get where in the placement the current frame is by index
  getPlacementPercent(current: CurrentFrame): number {
    const placement = this.placements![current.placementIndex];
    return current.frameIndex / placement.frames.length;
  }

  getCurrentPlacement(current: CurrentFrame): AnalysisPlacement {
    return this.placements![current.placementIndex];
  }

  getCurrentFrame(current: CurrentFrame): { placement: AnalysisPlacement, frame: Frame } {
    const placement = this.getCurrentPlacement(current);
    const frame = placement.frames[current.frameIndex];
    return { placement, frame }
  }

  getIsolatedBoard(current: CurrentFrame): TetrisBoard {
    const placement = this.getCurrentPlacement(current);
    return BufferTranscoder.decode(placement.encodedIsolatedBoard);
  }

  getActivePiece(current: CurrentFrame): MoveableTetromino | null {
    const { placement, frame } = this.getCurrentFrame(current);
    if (frame.mtPose) return MoveableTetromino.fromMTPose(placement.current, frame.mtPose);
    return null;
  }

  getLevel(current: CurrentFrame): number {
    const { placement, frame } = this.getCurrentFrame(current);
    if (frame.fullState) return frame.fullState.level;
    return placement.level;
  }

  getLines(current: CurrentFrame): number {
    const { placement, frame } = this.getCurrentFrame(current);
    if (frame.fullState) return frame.fullState.lines;
    return placement.lines;
  }

  getScore(current: CurrentFrame): number {
    const { placement, frame } = this.getCurrentFrame(current);
    if (frame.fullState) return frame.fullState.score;
    return placement.score;
  }

  // Get the board to display for the current frame
  getDisplayBoard(current: CurrentFrame): TetrisBoard {
    const { placement, frame } = this.getCurrentFrame(current);

    if (frame.fullState) return frame.fullState.board;

    // If full board is specified, decode and return that
    if (frame.encodedBoard) return BufferTranscoder.decode(frame.encodedBoard);

    // If the active piece's position is specified, blitz the active piece onto the isolated board
    else if (frame.mtPose) {
      const mt = MoveableTetromino.fromMTPose(placement.current, frame.mtPose);
      const board = BufferTranscoder.decode(placement.encodedIsolatedBoard);
      mt.blitToBoard(board);
      return board;
    }
    
    // If neither is specified, return the isolated board
    else return BufferTranscoder.decode(placement.encodedIsolatedBoard);
  }

  ngOnDestroy(): void {
    clearInterval(this.resizeInterval);
  }

  // on window resize, update the svgRect
  onResize(): void {
    const rect = this.contentElement.nativeElement.getBoundingClientRect();
    this.contentRect$.next(rect);
  }

  // MM:SS:mm
  msToTimestamp(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  getTimeString(current: CurrentFrame): string {
    const { frame } = this.getCurrentFrame(current);
    return `${this.msToTimestamp(frame.ms)} of ${this.finalTimestampString}`;
  }

  private convertToRecommendationGroup(
    actualPlacement: MoveableTetromino,
    type: RecommendationType,
    recommendations: RawRecommendation[]
  ): RecommendationGroup {

    let actualIndex = -1;
    for (let i = 0; i < recommendations.length; i++) {
      if (recommendations[i].firstPlacement.equals(actualPlacement)) {
        actualIndex = i;
        break;
      }
    }

    return {
      type,
      hasNextBox: recommendations[0].secondPlacement !== undefined,
      recommendations: recommendations.map(
        (recommendation, i) => Object.assign({}, recommendation, {
          isActual: i === actualIndex,
          color: this.getEvalColor(recommendations[0].score, recommendation.score)
        })
      )
    }

  }

  private async getStackrabbit(placementIndex: number, inputSpeed: InputSpeed): Promise<StackRabbit> {

    console.log('Getting stackrabbit analysis', placementIndex, "speed", inputSpeed);

    const none = { placementIndex, recommendations: [], ratedMove: null };

    if (!this.placements || placementIndex >= this.placements.length) return none;
    const placement = this.placements[placementIndex];
    if (!placement) return none;

    const status = new SmartGameStatus(this.game!.start_level, placement.lines, placement.score, placement.level);
    const board = BufferTranscoder.decode(placement.encodedIsolatedBoard);
    const placementMT = MoveableTetromino.fromMTPose(placement.current, placement.placement);
    
    let topMovesHybrid: TopMovesHybridResponse | null = null;
    try {

      // Get the recommendations for the current placement
      topMovesHybrid = await this.stackrabbitService.getTopMovesHybrid({
        board: board,
        currentPiece: placement.current,
        nextPiece: placement.next,
        level: placement.level,
        lines: placement.lines,
        inputSpeed: inputSpeed,
        playoutDepth: 3,
      });

    } catch (error) {
      return none;
    }

    if (!topMovesHybrid || !topMovesHybrid.nextBox) return none;

    // Convert topMovesHybrid to RecommendationGroups
    const recommendations: RecommendationGroup[] = [];
    recommendations.push(this.convertToRecommendationGroup(placementMT, RecommendationType.ENGINE_MOVE, topMovesHybrid.nextBox));
    recommendations.push(this.convertToRecommendationGroup(placementMT, RecommendationType.NO_NEXT_BOX, topMovesHybrid.noNextBox));

    // Find the player's move in the recommendations, if it exists
    for (let topPlacementPair of topMovesHybrid.nextBox) {
      if (topPlacementPair.firstPlacement.equals(placementMT)) {
        console.log('Found player move in recommendations', placementIndex);
        return {
          placementIndex,
          recommendations, 
          ratedMove: {
            bestEval: topMovesHybrid.nextBox[0].score, // Score of the best move for the position
            playerEval: topPlacementPair.score, // Score of the player's placement
          }
        }
      }
    }

    // If player move not in recommendations, get the resulting board and status after the placement
    const placementBoard = board.copy();
    const mt = MoveableTetromino.fromMTPose(placement.current, placement.placement);
    mt.blitToBoard(placementBoard);

    // Process line clears
    const numLineClears = placementBoard.processLineClears();
    status.onLineClear(numLineClears);

    try {
      const recommendationsAfterPlacement = await this.stackrabbitService.getTopMovesHybrid({
        board: placementBoard,
        currentPiece: placement.next,
        nextPiece: null,
        level: status.level,
        lines: status.lines,
        inputSpeed: inputSpeed,
        playoutDepth: 2,
      });

      if (!recommendationsAfterPlacement || !recommendationsAfterPlacement.noNextBox) throw new Error();   
      
      console.log('Got post-placement recommendations', placementIndex);
      return {
        placementIndex,
        recommendations,
        ratedMove: { bestEval: topMovesHybrid.nextBox[0].score, playerEval: recommendationsAfterPlacement.noNextBox[0].score }
      }
    } catch (error) {
      return {
        placementIndex,
        recommendations,
        ratedMove: null
      }
    }

  }

  public getEvalColor(bestEval: number, playerEval: number) {
    const placementScore = calculatePlacementScore(bestEval, playerEval);
    const rating = placementScoreRating(placementScore);
    return EVALUATION_TO_COLOR[rating];
  }

  public displayHoveredBoard(current: CurrentFrame, hoveredRecommendation: Recommendation | null): Recommendation | null {
    if (!hoveredRecommendation) return null;

    // If current frame is not a MT frame, cannot display hovered board
    const { frame } = this.getCurrentFrame(current);
    if (!frame.mtPose) return null;

    return hoveredRecommendation;
  }

  public setHoveredRecommendation(recommendation: Recommendation | null) {

    // If playing, do not set hovered recommendation
    if (this.playing$.getValue()) return;

    this.hoveredRecommendation$.next(recommendation);
  }

  showEngineMove(stackrabbit: StackRabbit, showEngineMove: boolean | null): MoveableTetromino | undefined {
    if (!showEngineMove) return undefined;

    const placement = stackrabbit.recommendations[0].recommendations[0].firstPlacement;

    const boardWithPlacement = new TetrisBoard();
    placement.blitToBoard(boardWithPlacement);

    // also blit placement with one row above so that there must be one layer of space
    placement.moveBy(0, 0, -1);
    placement.blitToBoard(boardWithPlacement);
    placement.moveBy(0, 0, 1);

    // do not show if stackrabbit placement index differs from current placement index (i.e. not loaded yet)
    const current = this.current$.getValue();
    if (stackrabbit.placementIndex !== current.placementIndex) return undefined;

    // Do not show if not MT frame
    const activePiece = this.getActivePiece(current);
    if (!activePiece) return undefined;
 
    // Do not show if placement intersects active piece
    if (activePiece.intersectsBoard(boardWithPlacement)) return undefined;
    
    // Show the engine move
    return placement;
  }

  getAverageEvalLoss(): number {
    return 0 - Math.round(this.game!.average_eval_loss * 10) / 10;
  }

  getRatingCount(rating: EvaluationRating): number {
    switch (rating) {
      case EvaluationRating.BRILLIANT: return this.game!.brilliant_count;
      case EvaluationRating.BEST: return this.game!.best_count;
      case EvaluationRating.EXCELLENT: return this.game!.excellent_count;
      case EvaluationRating.GOOD: return this.game!.good_count;
      case EvaluationRating.INACCURACY: return this.game!.inaccurate_count;
      case EvaluationRating.MISTAKE: return this.game!.mistake_count;
      case EvaluationRating.BLUNDER: return this.game!.blunder_count;
      default: return 0;
    }
  }
}
