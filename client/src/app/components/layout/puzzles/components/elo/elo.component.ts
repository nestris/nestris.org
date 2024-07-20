import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DBUser } from 'src/app/shared/models/db-user';


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

    const userid = this.websocketService.getUserID();
    if (!userid) return; // user is not logged in

    const user = await fetchServer2<DBUser>(Method.GET, `/api/v2/user/${userid}`);
    this.eloStats$.next({ elo: user.puzzleElo, highest: user.highestPuzzleElo });
  }

}
