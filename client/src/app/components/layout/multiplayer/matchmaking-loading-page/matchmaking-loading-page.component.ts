import { Component, OnDestroy, OnInit } from "@angular/core";
import { BehaviorSubject, interval } from "rxjs";


@Component({
  selector: 'app-matchmaking-loading-page',
  templateUrl: './matchmaking-loading-page.component.html',
  styleUrls: ['./matchmaking-loading-page.component.scss']
})
export class MatchmakingLoadingPageComponent implements OnInit, OnDestroy {

    score: number = 0;
    scoreVisible: boolean = false;

    numPeriods$: BehaviorSubject<number> = new BehaviorSubject(0);
    interval: any;

    // rotate between '', '.', '..', '...' for the periods
    ngOnInit() {
        this.interval = interval(500).subscribe(() => {
            this.numPeriods$.next((this.numPeriods$.value + 1) % 4);
        });
    }

    ngOnDestroy() {
        this.interval.unsubscribe();
    }

    getMessage(periods: number) {
      return "Searching for opponent" + ('.'.repeat(periods));
    }

    setScore(score: number) {
        this.score = score;
        if (score > 0) this.scoreVisible = true;
    }

}
