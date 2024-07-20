import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { getTimezone } from 'src/app/scripts/get-timezone';
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
    const userid = this.websocket.getUserID();
    if (!userid) return;

    // then, fetch the stats
    const params = {
      period: this.period,
      timezone: getTimezone()
    }
    this.attemptStats$.next(await fetchServer2<AttemptStats>(Method.GET, `/api/v2/puzzle-attempt-stats/${userid}`, params));
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
