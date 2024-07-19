import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { WebsocketService } from 'src/app/services/websocket.service';
import { PuzzleRank } from 'src/app/shared/puzzles/puzzle-rank';


@Component({
  selector: 'app-global-rank',
  templateUrl: './global-rank.component.html',
  styleUrls: ['./global-rank.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalRankComponent implements OnInit {

  public rank$ = new BehaviorSubject<PuzzleRank | null>(null);

  constructor(
    private websocketService: WebsocketService,
  ) {}

  async ngOnInit() {

    const username = this.websocketService.getUsername();
    if (!username) return; // user is not logged in

    this.rank$.next(await fetchServer2<PuzzleRank>(Method.GET, `/api/v2/puzzle-rank/${username}`));

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
