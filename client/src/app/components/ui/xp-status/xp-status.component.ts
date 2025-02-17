import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MeService } from 'src/app/services/state/me.service';
import { leagueColor } from 'src/app/shared/nestris-org/league-system';

const START_APPROACH_RATE = 0.02;
const END_APPROACH_RATE = 0.12;

@Component({
  selector: 'app-xp-status',
  templateUrl: './xp-status.component.html',
  styleUrls: ['./xp-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XpStatusComponent implements OnDestroy {

    readonly leagueColor = leagueColor;
    
    public me$ = this.meService.get$();
    public displayXP$ = new BehaviorSubject<number>(this.meService.getSync()!.xp);

    private delta = 0;

    private meChangeSubscription: Subscription;
  
    constructor(
      private readonly meService: MeService,
    ) {

      // On changes to xp, animate the bar to go to the new xp value
      this.meChangeSubscription = this.me$.subscribe((me) => {
        this.delta = me.xp - this.displayXP$.getValue();
        if (this.delta !== 0) setTimeout(() => this.approachXP(me.xp), 200);
      });

    }
  
    /**
     * Approach displayXP to xp over time, exiting when displayXP reaches xp
     */
    public approachXP(targetXP: number) {
      const diff = targetXP - this.displayXP$.getValue();
      
      let next;
      if (diff / this.delta > 0.3) {
        next = this.displayXP$.getValue() + this.delta * START_APPROACH_RATE;
      } else {
        next = this.displayXP$.getValue() + diff * END_APPROACH_RATE;
      }
  
      // if sufficiently close, just set to target
      if (Math.abs(targetXP - next) < 1) {
        this.displayXP$.next(targetXP);
        return;
      }
  
      this.displayXP$.next(next);
  
      setTimeout(() => this.approachXP(targetXP), 10);
    }

    ngOnDestroy(): void {
      this.meChangeSubscription.unsubscribe();
    }
}
