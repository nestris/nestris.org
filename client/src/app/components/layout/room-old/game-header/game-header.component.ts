import { Component, Input } from '@angular/core';
import { getMatchScore, MultiplayerData, PlayerRole } from 'src/app/shared/models/multiplayer';

@Component({
  selector: 'app-game-header',
  templateUrl: './game-header.component.html',
  styleUrls: ['./game-header.component.scss']
})
export class GameHeaderComponent {
  @Input() data!: MultiplayerData;
  @Input() role!: PlayerRole;
  @Input() color: 'blue' | 'red' = 'blue';

  getPlayerMatchScore(): number {
    return getMatchScore(this.data.match)[this.role];
  }

}
