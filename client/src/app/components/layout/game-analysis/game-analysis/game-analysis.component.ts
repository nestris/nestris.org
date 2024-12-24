import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Host, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatestWith, map, Observable, Subject } from 'rxjs';
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

interface GameData {
  game: DBGame; // game metadata
  placements: AnalysisPlacement[]; // list of placements interpreted from packets
}

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

  public game$ = new Subject<DBGame>();
  private placements$ = new Subject<AnalysisPlacement[]>();

  // subscribe to both game and packets
  public gameData$: Observable<GameData> = this.game$.pipe(
    combineLatestWith(this.placements$),
    map(([game, placements]) => ({ game, placements }))
  );

  public contentRect$ = new BehaviorSubject<DOMRect | null>(null);
  public memoryGameStatus = new MemoryGameStatus(18);
  private resizeInterval: any;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly websocketService: WebsocketService,
    private readonly apiService: ApiService,
    private readonly notificationService: NotificationService,
  ) {
    this.gameData$.subscribe(({ game, placements }) => {
      console.log('Game data received', game, placements);
    });
  }

  
  async ngOnInit() {

    // Wait for log in
    await this.websocketService.waitForSignIn();

    // Start listening for game data
    this.websocketService.setPacketGroupContainsPrefix(false);
    const startGameData = Date.now();
    const gameDataSubscription = this.websocketService.onPacketGroup().subscribe((packetGroup) => {

      // Ensure player index is not defined
      if (packetGroup.playerIndex !== undefined) throw new Error('Player index should not be defined');

      console.log('Received game data in', Date.now() - startGameData, 'ms', packetGroup.packets);
      const placements = interpretPackets(packetGroup.packets);
      this.placements$.next(placements);

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
      this.game$.next(game);

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

  previous() {
    console.log('Previous');
  }

  next() {
    console.log('Next');
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') this.previous();
    else if (event.key === 'ArrowRight') this.next();
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

  ngOnDestroy(): void {
    clearInterval(this.resizeInterval);
  }

  // on window resize, update the svgRect
  onResize(): void {
    const rect = this.contentElement.nativeElement.getBoundingClientRect();
    this.contentRect$.next(rect);
  }

}
