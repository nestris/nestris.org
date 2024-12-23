import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { NotificationService } from 'src/app/services/notification.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DBGame } from 'src/app/shared/models/db-game';
import { NotificationType } from 'src/app/shared/models/notifications';
import { PacketContent } from 'src/app/shared/network/stream-packets/packet';

@Component({
  selector: 'app-game-analysis',
  templateUrl: './game-analysis.component.html',
  styleUrls: ['./game-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameAnalysisComponent implements OnInit {

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly websocketService: WebsocketService,
    private readonly fetchService: FetchService,
    private readonly notificationService: NotificationService,
  ) {}

  private game$ = new BehaviorSubject<DBGame | null>(null);
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

    // Fetch the game metadata
    try {
      const game = await this.fetchService.fetch<DBGame>(Method.POST, `/api/v2/game/${gameID}/${sessionID}`);
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

}
