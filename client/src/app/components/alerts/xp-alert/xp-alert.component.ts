import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { League, LEAGUE_XP_REQUIREMENTS, leagueColor } from 'src/app/shared/nestris-org/league-system';

const START_APPROACH_RATE = 0.025;
const END_APPROACH_RATE = 0.12;

@Component({
  selector: 'app-xp-alert',
  templateUrl: './xp-alert.component.html',
  styleUrls: ['./xp-alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XPAlertComponent implements OnInit, OnChanges {
  @Input() hide: boolean = false;
  @Input() league!: League;
  @Input() xp!: number;

  readonly leagueColor = leagueColor;

  public targetXP!: number;
  public percent!: number;

  public displayXP$ = new BehaviorSubject<number>(0);
  private delta = 0;

  ngOnInit(): void {
    this.targetXP = LEAGUE_XP_REQUIREMENTS[this.league];
    this.displayXP$.next(this.xp);
  }

  public getPercent(displayXP: number | null): number {
    if (!displayXP) return 0;
    return Math.min(100, Math.round(displayXP / this.targetXP * 100));
  }

  ngOnChanges() {
    this.delta = this.xp - this.displayXP$.getValue();
    this.approachXP();
  }

  /**
   * Approach displayXP to xp over time, exiting when displayXP reaches xp
   */
  public approachXP() {
    const diff = this.xp - this.displayXP$.getValue();
    console.log(this.delta, diff, this.displayXP$.getValue(), this.xp);
    
    let next;
    if (diff / this.delta > 0.3) {
      next = this.displayXP$.getValue() + this.delta * START_APPROACH_RATE;
    } else {
      next = this.displayXP$.getValue() + diff * END_APPROACH_RATE;
    }

    // if sufficiently close, just set to target
    if (Math.abs(this.xp - next) < 1) {
      this.displayXP$.next(this.xp);
      return;
    }

    this.displayXP$.next(next);

    setTimeout(() => this.approachXP(), 10);
  }

  

}
