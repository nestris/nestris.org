import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, from, Observable, of, startWith, switchMap } from 'rxjs';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { WebsocketService } from 'src/app/services/websocket.service';
import { PuzzleRank } from 'src/app/shared/puzzles/puzzle-rank';


@Component({
  selector: 'app-global-rank',
  templateUrl: './global-rank.component.html',
  styleUrls: ['./global-rank.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalRankComponent {

  public rank$: Observable<PuzzleRank | null>;

  constructor(private websocketService: WebsocketService) {
    // Initialize rank$ in the constructor
    this.rank$ = this.websocketService.onSignIn().pipe(
      startWith(null),
      switchMap(() => {
        const userid = this.websocketService.getUserID();
        if (!userid) {
          // Return null if the user is not logged in
          return of(null);
        }

        // Fetch the puzzle rank and handle errors
        return from(fetchServer2<PuzzleRank>(Method.GET, `/api/v2/puzzle-rank/${userid}`)).pipe(
          catchError(() => of(null)) // Handle errors by emitting null
        );
      })
    );
  }

  hasRankAbove(rank: PuzzleRank | null): boolean {
    if (!rank) return false;
    if (rank.leaderboard[0] === null) return false;
    return rank.leaderboard[0].rank > 1;
  }

  hasRankBelow(rank: PuzzleRank | null): boolean {
    if (!rank) return false;
    if (rank.leaderboard[rank.leaderboard.length - 1] === null) return false;
    return true;
  }
}
