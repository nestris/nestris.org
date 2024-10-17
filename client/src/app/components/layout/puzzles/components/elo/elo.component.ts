import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, from, Observable, of, startWith, Subscription, switchMap } from 'rxjs';
import { FetchService, Method } from 'src/app/services/fetch.service';
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
export class EloComponent {
  public eloStats$ = new BehaviorSubject<EloStats>({ elo: 0, highest: 0 });

  constructor(
    private fetchService: FetchService,
  ) {

    this.fetchService.fetch<DBUser>(Method.GET, `/api/v2/me`).then(user => {
      this.eloStats$.next({ elo: user.puzzleElo, highest: user.highestPuzzleElo });
    });
  }
}
