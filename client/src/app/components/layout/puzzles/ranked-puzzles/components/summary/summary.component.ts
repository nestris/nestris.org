import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Method, fetchServer2 } from 'client/src/app/scripts/fetch-server';
import { getTimezone } from 'client/src/app/scripts/get-timezone';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { AttemptStats, TimePeriod } from 'network-protocol/puzzles/attempt-stats';
import { PuzzleRating } from 'network-protocol/puzzles/puzzle-rating';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryComponent implements OnChanges {
  @Input() period!: TimePeriod;

  attemptStats$ = new BehaviorSubject<AttemptStats>({
    puzzlesAttempted: 0,
    puzzlesSolved: 0,
    averageSolveDuration: 0,
    successRateForRating: {
      [PuzzleRating.ONE_STAR]: null,
      [PuzzleRating.TWO_STAR]: null,
      [PuzzleRating.THREE_STAR]: null,
      [PuzzleRating.FOUR_STAR]: null,
      [PuzzleRating.FIVE_STAR]: null,
    }
  });

  constructor(
    private websocket: WebsocketService
  ) {}

  // whenever the period changes, refresh the stats
  async ngOnChanges(changes: SimpleChanges) {

    // fetch username, but if not logged in, exit
    const username = this.websocket.getUsername();
    if (!username) return;

    // then, fetch the stats
    const params = {
      period: this.period,
      timezone: getTimezone()
    }
    this.attemptStats$.next(await fetchServer2<AttemptStats>(Method.GET, `/api/v2/puzzle-attempt-stats/${username}`, params));
    console.log("Stats:", this.attemptStats$.getValue());
  }

  roundPercent(num: number | null | undefined): string {
    if (num === null || num === undefined) return '0%';
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
