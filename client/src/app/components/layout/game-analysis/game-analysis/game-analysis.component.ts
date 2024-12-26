import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Host, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatestWith, debounceTime, distinct, distinctUntilChanged, filter, map, Observable, Subject, switchMap, tap } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { ApiService } from 'src/app/services/api.service';
import { NotificationService } from 'src/app/services/notification.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { EVALUATION_TO_COLOR, overallAccuracyRating } from 'src/app/shared/evaluation/evaluation';
import { DBGame } from 'src/app/shared/models/db-game';
import { NotificationType } from 'src/app/shared/models/notifications';
import { PacketContent } from 'src/app/shared/network/stream-packets/packet';
import { MemoryGameStatus } from 'src/app/shared/tetris/memory-game-status';
import { numberWithCommas, timeAgo } from 'src/app/util/misc';
import { AnalysisPlacement, interpretPackets } from '../game-interpreter';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { BufferTranscoder } from 'src/app/shared/network/tetris-board-transcoding/buffer-transcoder';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { RateMoveResponse, StackrabbitService, TopMovesHybridResponse } from 'src/app/services/stackrabbit/stackrabbit.service';
import { SmartGameStatus } from 'src/app/shared/tetris/smart-game-status';

interface GameData {
  game: DBGame; // game metadata
  placements: AnalysisPlacement[]; // list of placements interpreted from packets
}

interface CurrentFrame {
  placementIndex: number;
  frameIndex: number;
}

interface RatedMove {
  bestEval: number | null;
  playerEval: number | null;
}

const SPEEDS = [1, 2, 4, 0.5];

@Component({
  selector: 'app-game-analysis',
  templateUrl: './game-analysis.component.html',
  styleUrls: ['./game-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameAnalysisComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('content') contentElement!: ElementRef;

  readonly ButtonColor = ButtonColor;
  readonly timeAgo = timeAgo;
  readonly numberWithCommas = numberWithCommas;

  // The HTTP request for game metadata
  public game?: DBGame;

  // The packets send through websocket interpreted into placements
  public placements?: AnalysisPlacement[];

  // Observable of when both game metadata and placements are received
  public loaded$ = new BehaviorSubject<boolean>(false);

  // Current frame and placement to display
  public current$ = new BehaviorSubject<CurrentFrame>({ placementIndex: 0, frameIndex: 0 });

  public currentPlacement$!: Observable<number>;
  public stackrabbit$!: Observable<{
    recommendations: TopMovesHybridResponse | null,
    ratedMove: RatedMove
  }>;


  public playing$ = new BehaviorSubject<boolean>(false);

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
      return current.frameIndex === this.placements[current.placementIndex].placementFrameIndex;
    })
  )

  // Terrible hack to make app-game-summary-graph component fit the width of content div
  public contentRect$ = new BehaviorSubject<DOMRect | null>(null);
  private resizeInterval: any;

  // Derive memory game status from placements
  public memoryGameStatus: MemoryGameStatus | null = null;
  
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
        if (current.frameIndex < this.placements[current.placementIndex].placementFrameIndex) return current.placementIndex - 1;
        return current.placementIndex;
      }),
      distinctUntilChanged(),
      debounceTime(50) // rate-limit to prevent spamming SR analysis
    );

    this.stackrabbit$ = this.currentPlacement$.pipe(
      combineLatestWith(this.loaded$), // on load, start evaluating
      filter(([_, loaded]) => loaded),
      switchMap(([placementIndex, _]) => this.getStackrabbit(placementIndex)),
    );


    this.currentPlacement$.subscribe(placement => console.log('Current placement', placement));
    this.stackrabbit$.subscribe(analysis => console.log('Stackrabbit analysis', analysis));

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
    this.playing$.next(true);

    let current = this.current$.getValue();

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

  nextFrame(): boolean {
    let current = this.current$.getValue();
    const next = this.incrementCurrent(current);

    if (next == null) return false;

    this.current$.next(next);
    return true;
  }

  // Navigate to the previous placement at the frame index that matches piece lock
  previousPlacement(): boolean {
    const current = this.current$.getValue();
    if (current.placementIndex === 0) return false;
    const index = current.placementIndex - 1;
    this.current$.next({
      placementIndex: index,
      frameIndex: this.placements![index].placementFrameIndex
    });
    return true;
  }

  nextPlacement(): boolean {
    const current = this.current$.getValue();
    if (current.placementIndex === this.placements!.length - 1) return false;
    const index = current.placementIndex + 1;
    this.current$.next({
      placementIndex: index,
      frameIndex: this.placements![index].placementFrameIndex
    });
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
    else if (event.key === ".") this.nextFrame();
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

  getIsolatedBoard(current: CurrentFrame): TetrisBoard {
    return BufferTranscoder.decode(this.getCurrentPlacement(current).encodedIsolatedBoard);
  }

  getActivePiece(current: CurrentFrame): MoveableTetromino | null {
    const placement = this.getCurrentPlacement(current);
    const frame = placement.frames[current.frameIndex];
    if (frame.mtPose) return MoveableTetromino.fromMTPose(placement.current, frame.mtPose);
    return null;
  }

  // Get the board to display for the current frame
  getDisplayBoard(current: CurrentFrame): TetrisBoard {
    const placement = this.getCurrentPlacement(current);
    const frame = placement.frames[current.frameIndex];

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
    const placement = this.getCurrentPlacement(current);
    const frame = placement.frames[current.frameIndex];
    return `${this.msToTimestamp(frame.ms)} of ${this.finalTimestampString}`;
  }

  private async getStackrabbit(placementIndex: number): Promise<{
    recommendations: TopMovesHybridResponse | null,
    ratedMove: RatedMove
  }> {

    const none = { recommendations: null, ratedMove: { bestEval: null, playerEval: null } };

    if (!this.placements || placementIndex >= this.placements.length) return none;
    const placement = this.placements[placementIndex];
    if (!placement) return none;

    const status = new SmartGameStatus(this.game!.start_level, placement.lines, placement.score, placement.level);
    const board = BufferTranscoder.decode(placement.encodedIsolatedBoard);
    const placementMT = MoveableTetromino.fromMTPose(placement.current, placement.placement);
    
    let recommendations: TopMovesHybridResponse | null = null;
    try {

      // Get the recommendations for the current placement
      recommendations = await this.stackrabbitService.getTopMovesHybrid({
        board: board,
        currentPiece: placement.current,
        nextPiece: placement.next,
        level: placement.level,
        lines: placement.lines,
        playoutDepth: 3,
      });

    } catch (error) {
      return none;
    }

    if (!recommendations || !recommendations.nextBox) return none;

    // Find the player's move in the recommendations, if it exists
    for (let topPlacementPair of recommendations.nextBox) {
      if (topPlacementPair.firstPlacement.equals(placementMT)) {
        console.log('Found player move in recommendations', placementIndex);
        return {
          recommendations, 
          ratedMove: {
            bestEval: recommendations.nextBox[0].score, // Score of the best move for the position
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
        playoutDepth: 2,
      });

      if (!recommendationsAfterPlacement || !recommendationsAfterPlacement.noNextBox) throw new Error();   
      
      console.log('Got post-placement recommendations', placementIndex);
      return {
        recommendations,
        ratedMove: { bestEval: recommendations.nextBox[0].score, playerEval: recommendationsAfterPlacement.noNextBox[0].score }
      }
    } catch (error) {
      return {
        recommendations,
        ratedMove: { bestEval: null, playerEval: null }
      }
    }

  }


}
