import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BehaviorSubject, catchError, from, Observable, of, switchMap } from 'rxjs';
import { getTimezone } from 'src/app/scripts/get-timezone';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { TimePeriod, AttemptStats } from 'src/app/shared/puzzles/attempt-stats';
import { PuzzleRating } from 'src/app/shared/puzzles/puzzle-rating';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryComponent implements OnChanges {
  @Input() period!: TimePeriod;

  readonly PuzzleRating = PuzzleRating;

  // Default attempt stats
  private readonly defaultAttemptStats: AttemptStats = {
    puzzlesAttempted: 0,
    puzzlesSolved: 0,
    averageSolveDuration: 0,
    attemptStatsForRating: {}
  };

  // Define attemptStats$ as an observable directly
  public attemptStats$: Observable<AttemptStats>;

  constructor(
    private fetchService: FetchService,
    private websocket: WebsocketService
  ) {
    this.attemptStats$ = of(this.defaultAttemptStats);
  }

  // whenever the period changes, refresh the stats
  ngOnChanges(changes: SimpleChanges) {
    // Whenever `period` changes, fetch new stats
    if (changes['period'] && this.period) {
      this.attemptStats$ = this.websocket.onSignIn().pipe(
        switchMap(() => {
          const userid = this.websocket.getUserID();
          if (!userid) {
            // Return default stats if the user is not logged in
            return of(this.defaultAttemptStats);
          }

          const params = {
            period: this.period,
            timezone: getTimezone()
          };

          // Fetch the attempt stats and handle errors
          return from(this.fetchService.fetch<AttemptStats>(Method.GET, `/api/v2/puzzle-attempt-stats/${userid}`, params)).pipe(
            catchError(() => of(this.defaultAttemptStats)) // Return default on error
          );
        })
      );
    }
  }


  roundPercent(num: number | null | undefined): string {
    if (num === null || num === undefined) return '-';
    return (num * 100).toFixed(1) + '%';
  }

  overallSuccessRate(stats: AttemptStats | null): string {
    if (!stats) return '0%';
    if (stats.puzzlesAttempted === 0) return '0%';
    return this.roundPercent(stats.puzzlesSolved / stats.puzzlesAttempted);
  }

  solveDuration(stats: AttemptStats | null): string {
    if (!stats) return '0:00';

    // pad duration to 2 digits
    let duration = stats.averageSolveDuration.toFixed(0);
    if (duration.length === 1) duration = '0' + duration;
    return `0:${duration}`;
  }

  keyAsRating(key: string): PuzzleRating {
    return parseInt(key) as PuzzleRating;
  }

}
