import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, from, Observable, of, startWith, Subscription, switchMap } from 'rxjs';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { getTimezone } from 'src/app/scripts/get-timezone';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DailyStreak } from 'src/app/shared/puzzles/daily-streak';

@Component({
  selector: 'app-daily-streak',
  templateUrl: './daily-streak.component.html',
  styleUrls: ['./daily-streak.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyStreakComponent {

  public readonly PUZZLE_COUNT = 10;

  public streak$: BehaviorSubject<DailyStreak>;

  constructor(private websocketService: WebsocketService) {
    this.streak$ = new BehaviorSubject<DailyStreak>(this.getEmptyStreak());
  }

  async ngOnInit() {
    await this.websocketService.waitForSignIn();

    const userid = this.websocketService.getUserID();

    this.streak$.next(await fetchServer2<DailyStreak>(
      Method.GET,
      `/api/v2/daily-streak/${userid}`,
      { timezone: getTimezone() })
    );
  }

  private getEmptyStreak(): DailyStreak {

    let days: DailyStreak = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      days.push ({
        count: 0,
        weekday: day.toLocaleDateString('en-US', { weekday: 'long', timeZone: getTimezone() })
      });
    };

    console.log("default streak: ", days);
    return days;
  }

  getTodayCount(streak: DailyStreak | null): number {
    if (!streak) return 0;
    return streak[streak.length - 1].count;
  }

  getProgressString(streak: DailyStreak | null): string {
    const count = this.getTodayCount(streak);
    const left = this.PUZZLE_COUNT - count;
    if (left === this.PUZZLE_COUNT) {
      return "Let's get solving!";
    }
    else if (left >= 5) {
      return `${left} puzzles to go!`;
    } else if (left >= 2) {
      return `Just ${left} more puzzles left!`;
    } else if (left === 1) {
      return "You're down to your last puzzle!";
    } else {
      return "You did it! Great job!";
    }
  }

}