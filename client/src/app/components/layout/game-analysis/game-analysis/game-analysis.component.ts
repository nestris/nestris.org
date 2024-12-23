import { ChangeDetectionStrategy, Component, Host, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { ApiService } from 'src/app/services/api.service';
import { NotificationService } from 'src/app/services/notification.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { EVALUATION_TO_COLOR, overallAccuracyRating } from 'src/app/shared/evaluation/evaluation';
import { DBGame } from 'src/app/shared/models/db-game';
import { NotificationType } from 'src/app/shared/models/notifications';
import { PacketContent } from 'src/app/shared/network/stream-packets/packet';
import { numberWithCommas, timeAgo } from 'src/app/util/misc';

@Component({
  selector: 'app-game-analysis',
  templateUrl: './game-analysis.component.html',
  styleUrls: ['./game-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameAnalysisComponent implements OnInit {

  readonly ButtonColor = ButtonColor;
  readonly timeAgo = timeAgo;
  readonly numberWithCommas = numberWithCommas;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly websocketService: WebsocketService,
    private readonly apiService: ApiService,
    private readonly notificationService: NotificationService,
  ) {}

  public game$ = new BehaviorSubject<DBGame | null>(null);
  private packets: PacketContent[] | null = null;
  
  async ngOnInit() {

    // Wait for log in
    await this.websocketService.waitForSignIn();

    // Start listening for game data
    this.websocketService.setPacketGroupContainsPrefix(false);
    const startGameData = Date.now();
    const gameDataSubscription = this.websocketService.onPacketGroup().subscribe((packetGroup) => {

      // Ensure player index is not defined
      if (packetGroup.playerIndex !== undefined) throw new Error('Player index should not be defined');

      this.packets = packetGroup.packets;
      console.log('Received game data in', Date.now() - startGameData, 'ms', this.packets);
      this.onGameDataReceived();

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
      this.game$.next(game);
      console.log('Game metadata', game, 'fetched in', Date.now() - startFetchGame, 'ms');
    } catch (error: any) {

      // If error code is 410, the game has been deleted
      const message = (error.status === 410) ? 'Replay file for this game has expired' : 'There was an error fetching the game';
      this.notificationService.notify(NotificationType.ERROR, message);
    
      this.router.navigate(['/review']);
    }
  }

  private onGameDataReceived() {
    // TODO
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

}
