import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RoomService } from 'src/app/services/room/room.service';
import { calculateScoreForPlayer, MultiplayerRoomState, PlayerIndex, pointWinner } from 'src/app/shared/room/multiplayer-room-models';
import { MultiplayerComponent } from '../../multiplayer-room/multiplayer-component';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { Router } from '@angular/router';
import { RankedQueueService } from 'src/app/services/room/ranked-queue.service';

@Component({
  selector: 'app-multiplayer-after-match-modal',
  templateUrl: './multiplayer-after-match-modal.component.html',
  styleUrls: ['./multiplayer-after-match-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiplayerAfterMatchModalComponent extends MultiplayerComponent {

  constructor(
    roomService: RoomService,
    private readonly queueService: RankedQueueService,
    private readonly router: Router,
  ) {
    super(roomService);
  }

  readonly calculateScoreForPlayer = calculateScoreForPlayer;
  readonly pointWinner = pointWinner;
  readonly ButtonColor = ButtonColor;


  getPointText(index: PlayerIndex): string {
    if (index === PlayerIndex.DRAW) return 'Draw';
    if (this.getIndexColor(index) === 'blue') return 'Win';
    return 'Loss';
  }

  getMatchText(state: MultiplayerRoomState): string {
    if (state.matchWinner === PlayerIndex.DRAW) return 'Draw';
    if (state.matchWinner === this.getColorIndex("blue")) return 'Victory';
    return 'Defeat';
  }

  async playNewMatch() {

    // Leave the room
    await this.roomService.leaveRoom();

    // Join the queue
    await this.queueService.joinQueue();
  }

  async exit() {
    await this.roomService.leaveRoom();
    this.router.navigate(['/']);
  }


}
