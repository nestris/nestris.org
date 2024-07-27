import { Component, Input } from '@angular/core';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { Platform } from 'src/app/services/platform-interface.service';
import { getMatchScore, MultiplayerData, PlayerRole } from 'src/app/shared/models/multiplayer';
import { Role } from 'src/app/shared/models/room-info';

@Component({
  selector: 'app-multiplayer-in-match',
  templateUrl: './multiplayer-in-match.component.html',
  styleUrls: ['./multiplayer-in-match.component.scss']
})
export class MultiplayerInMatchComponent {
  @Input() data!: MultiplayerData;

  readonly ButtonColor = ButtonColor;
  readonly players: PlayerRole[] = [Role.PLAYER_1, Role.PLAYER_2];

  getColor(role: PlayerRole): string {
    return role === Role.PLAYER_1 ? "blue" : "red";
  }

  getPlayerScore(data: MultiplayerData, role: PlayerRole): number {
    const score = getMatchScore(data.match);
    return score[role];
  }

}
