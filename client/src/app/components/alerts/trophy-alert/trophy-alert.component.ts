import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { sleep } from 'src/app/util/misc';

@Component({
  selector: 'app-trophy-alert',
  templateUrl: './trophy-alert.component.html',
  styleUrls: ['./trophy-alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrophyAlertComponent implements OnInit {
  @Input() hide: boolean = false;
  @Input() startTrophies: number = 1000;
  @Input() trophyDelta: number = 30;

  // Start with the initial number of trophies
  trophies$ = new BehaviorSubject<number>(this.startTrophies);

  async ngOnInit() {

    this.trophies$.next(this.startTrophies);

    // Initial delay before starting the animation
    await sleep(800);
  
    const finalTrophies = this.startTrophies + this.trophyDelta;
    let current = this.startTrophies;
  
    // We'll keep halving the gap until it's very small
    while (Math.abs(finalTrophies - current) > 1) {
      // Halve the gap each iteration
      let gap = (finalTrophies - current) / 10;
      if (gap > 0 && gap < 1) gap = 1;
      if (gap < 0 && gap > -1) gap = -1;
      current += Math.round(gap);
  
      // Update the BehaviorSubject with the new value
      this.trophies$.next(current);
  
      // Pause between updates to create a smooth animation
      await sleep(30);
    }
  
    // Make sure the final value is reached
    this.trophies$.next(finalTrophies);
  }

  getDeltaString() {
    return (this.trophyDelta > 0 ? '+' : '') + this.trophyDelta;
  }
}
