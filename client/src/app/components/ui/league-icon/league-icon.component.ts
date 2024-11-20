import { Component, Input } from '@angular/core';
import { League } from 'src/app/shared/nestris-org/league-system';

@Component({
  selector: 'app-league-icon',
  templateUrl: './league-icon.component.html',
  styleUrls: ['./league-icon.component.scss']
})
export class LeagueIconComponent {
  @Input() league: League | null | undefined;
  @Input() height: number = 50;
  @Input() flipped: boolean = false;

  private readonly LEAGUE_ICONS: {[league in League]? : string} = {
    [League.MINO_5]: "mino-5",
    [League.MINO_4]: "mino-4",
    [League.MINO_3]: "mino-3",
    [League.MINO_2]: "mino-2",
    [League.MINO_1]: "mino-1",
  }

  public leagueToIcon(league: League | null | undefined) : string {
    if (league === null || league === undefined) return "";

    const flipped = this.flipped ? "-flipped" : "";

    return `${this.LEAGUE_ICONS[league]}${flipped}.svg`;
  }
}
