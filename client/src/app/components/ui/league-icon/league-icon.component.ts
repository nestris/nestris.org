import { Component, Input } from '@angular/core';
import { League } from 'src/app/shared/nestris-org/league-system';

@Component({
  selector: 'app-league-icon',
  templateUrl: './league-icon.component.html',
  styleUrls: ['./league-icon.component.scss']
})
export class LeagueIconComponent {
  @Input() league!: League;
  @Input() height: number = 50;

  public leagueToIcon(league: League): string {
    switch (league) {
      case League.MINO_5: return "mino-5.svg";
      case League.MINO_4: return "mino-4.svg";
      case League.MINO_3: return "mino-3.svg";
      case League.MINO_2: return "mino-2.svg";
      case League.MINO_1: return "mino-1.svg";
      default: return "";
    }
  }
}
