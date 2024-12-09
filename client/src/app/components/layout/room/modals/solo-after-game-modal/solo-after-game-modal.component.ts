import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { filter, map, Observable } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { RoomService } from 'src/app/services/room/room.service';
import { SoloClientRoom, SoloClientState } from 'src/app/services/room/solo-client-room';
import { EVALUATION_TO_COLOR, overallAccuracyRating } from 'src/app/shared/evaluation/evaluation';
import { GameSummary, SoloRoomState } from 'src/app/shared/room/solo-room-models';
import { numberWithCommas } from 'src/app/util/misc';

@Component({
  selector: 'app-solo-after-game-modal',
  templateUrl: './solo-after-game-modal.component.html',
  styleUrls: ['./solo-after-game-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoloAfterGameModalComponent {

  public soloClientRoom = this.roomService.getClient<SoloClientRoom>();

  // Get the last game summary from the room state
  public summary$ = this.soloClientRoom.getState$<SoloRoomState>().pipe(
    map(state => state.lastGameSummary),
    filter(summary => !!summary)
  )

  readonly ButtonColor = ButtonColor;
  readonly numberWithCommas = numberWithCommas;

  constructor(
    private readonly roomService: RoomService,
    public readonly emulatorService: EmulatorService,
    private readonly router: Router,
  ) {
    const history = this.emulatorService.getLastGameStatus()!.getHistory();

    const snapshots = [];
    for (let i = 0; i < history.length(); i++) {
      snapshots.push(history.getSnapshot(i));
    }
    console.log(snapshots);

  }

  public exit() {
    this.router.navigate(['/']);
  }

  // go from after game modal to before game modal
  public next() {
    this.soloClientRoom.setSoloState(SoloClientState.BEFORE_GAME_MODAL);
  }

  // Pressing "space" or "enter" should also trigger the next button
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.next();
    }
  }

  getAccuracyColor(accuracy: number): string {
    const rating = overallAccuracyRating(accuracy);
    return EVALUATION_TO_COLOR[rating];
  }

}