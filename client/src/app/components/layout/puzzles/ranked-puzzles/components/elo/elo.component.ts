import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Method, fetchServer2 } from 'client/src/app/scripts/fetch-server';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { UserInfo } from 'os';
import { BehaviorSubject } from 'rxjs';
import { DBUser } from 'server/database/user-queries';

interface EloStats {
  elo: number;
  highest: number;
}

@Component({
  selector: 'app-elo',
  templateUrl: './elo.component.html',
  styleUrls: ['./elo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EloComponent implements OnInit {
  public eloStats$ = new BehaviorSubject<EloStats>({ elo: 0, highest: 0 });

  constructor(
    private websocketService: WebsocketService,
  ) {}

  async ngOnInit() {

    const username = this.websocketService.getUsername();
    if (!username) return; // user is not logged in

    const user = await fetchServer2<DBUser>(Method.GET, `/api/v2/user/${username}`);
    this.eloStats$.next({ elo: user.puzzleElo, highest: user.highestPuzzleElo });
  }

}
