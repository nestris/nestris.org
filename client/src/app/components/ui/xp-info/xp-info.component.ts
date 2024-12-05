import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { League, LEAGUE_XP_REQUIREMENTS, leagueColor } from 'src/app/shared/nestris-org/league-system';

@Component({
  selector: 'app-xp-info',
  templateUrl: './xp-info.component.html',
  styleUrls: ['./xp-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XpInfoComponent {
  @Input() league!: League;
  @Input() xp!: number;
  @Input() barWidth: string = '220px';
  @Input() barHeight: string = '12px';

  readonly leagueColor = leagueColor;

  public getPercent(displayXP: number | null): number {
    if (!displayXP) return 0;
    return Math.min(100, Math.round(displayXP / this.getTargetXP(this.league) * 100));
  }

  public getTargetXP(league: League): number {
    return LEAGUE_XP_REQUIREMENTS[league];
  }

}