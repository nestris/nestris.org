import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, from, interval, Observable, of, startWith, switchMap, takeUntil, shareReplay } from 'rxjs';
import { WebsocketService } from 'src/app/services/websocket.service';
import { PuzzleRank } from 'src/app/shared/puzzles/puzzle-rank';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-global-rank',
  templateUrl: './global-rank.component.html',
  styleUrls: ['./global-rank.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalRankComponent implements OnInit, OnDestroy {
  
  public rank$ = new BehaviorSubject<PuzzleRank | null>(null);
  private interval: any;
  private readonly FETCH_INTERVAL = 5000;

  constructor(private websocketService: WebsocketService) {}

  async ngOnInit() {
    await this.websocketService.waitForSignIn();
    this.updateRank();
    this.interval = setInterval(() => this.updateRank(), this.FETCH_INTERVAL);
  }

  private async updateRank() {
    const userid = this.websocketService.getUserID();
    if (!userid) {
      return;
    }
    console.log("Updating rank");
  }

  ngOnDestroy() {
    clearInterval(this.interval);
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