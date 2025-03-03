import { ChangeDetectionStrategy, Component, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { filter, map, Observable } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { GamepadService } from 'src/app/services/gamepad.service';
import { OcrGameService } from 'src/app/services/ocr/ocr-game.service';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { RoomService } from 'src/app/services/room/room.service';
import { SoloClientRoom, SoloClientState } from 'src/app/services/room/solo-client-room';
import { MeService } from 'src/app/services/state/me.service';
import { EVALUATION_TO_COLOR, overallAccuracyRating } from 'src/app/shared/evaluation/evaluation';
import { Platform } from 'src/app/shared/models/platform';
import { GameSummary, SoloRoomState } from 'src/app/shared/room/solo-room-models';
import { MemoryGameStatus } from 'src/app/shared/tetris/memory-game-status';
import { getFeedback } from 'src/app/util/game-feedback';
import { numberWithCommas } from 'src/app/util/misc';

@Component({
  selector: 'app-solo-after-game-modal',
  templateUrl: './solo-after-game-modal.component.html',
  styleUrls: ['./solo-after-game-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoloAfterGameModalComponent implements OnDestroy {

  public soloClientRoom = this.roomService.getClient<SoloClientRoom>();

  // Get the last game summary from the room state
  public summary$ = this.soloClientRoom.getState$<SoloRoomState>().pipe(
    map(state => state.lastGameSummary),
    filter(summary => !!summary)
  )

  readonly ButtonColor = ButtonColor;
  readonly numberWithCommas = numberWithCommas;

  private gamepadSubscription: any;

  public lastGameStatus: MemoryGameStatus;
  public lastGameFeedback: string;

  constructor(
    private readonly roomService: RoomService,
    private readonly emulatorService: EmulatorService,
    private readonly ocrService: OcrGameService,
    private readonly platformService: PlatformInterfaceService,
    private readonly meService: MeService,
    private readonly gamepadService: GamepadService,
    private readonly router: Router,
  ) {

    this.gamepadSubscription = this.gamepadService.onPress().subscribe(key => this.onKeyDown(key));

    this.lastGameStatus = this.platformService.getPlatform() === Platform.OCR ? this.ocrService.getMemoryStatus()! : this.emulatorService.getLastGameStatus()!;
    console.log("last game status", this.lastGameStatus);
    this.lastGameFeedback = getFeedback(this.lastGameStatus, this.meService.getSync()!.highest_lines);

    const history = this.lastGameStatus.getHistory();

    const snapshots = [];
    for (let i = 0; i < history.length(); i++) {
      snapshots.push(history.getSnapshot(i));
    }
    console.log(snapshots);

  }

  ngOnDestroy() {
    this.gamepadSubscription.unsubscribe();
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
    this.onKeyDown(event.key);
  }

  private onKeyDown(key: string) {
    const me = this.meService.getSync();
    if (!me) return;

    if (key === me.keybind_emu_start) {
      this.next();
    }
  }

  getAccuracyColor(accuracy: number): string {
    const rating = overallAccuracyRating(accuracy);
    return EVALUATION_TO_COLOR[rating];
  }

}