import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, from, Observable, of, startWith, Subscription, switchMap } from 'rxjs';
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
export class EloComponent {
  public eloStats$: Observable<EloStats>;

  private readonly DEFAULT_ELO_STATS = { elo: 0, highest: 0 };

  constructor(private websocketService: WebsocketService) {
    // Initialize eloStats$ in the constructor with reactive logic
    this.eloStats$ = this.websocketService.onSignIn().pipe(
      startWith(null), // Emit an initial value (null) or replace with default Elo stats
      switchMap(() => {
        const userid = this.websocketService.getUserID();
        if (!userid) {
          // Return default Elo stats if the user is not logged in
          return of(this.DEFAULT_ELO_STATS);
        }

        // Convert the Promise to an observable and handle errors
        return from(fetchServer2<DBUser>(Method.GET, `/api/v2/user/${userid}`)).pipe(
          switchMap(user => of({ elo: user.puzzleElo, highest: user.highestPuzzleElo })),
          catchError(() => of(this.DEFAULT_ELO_STATS)) // Return default Elo stats on error
        );
      })
    );
  }
}
