import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnDestroy, Output } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { GamepadService } from 'src/app/services/gamepad.service';
import { Platform, PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { RoomService } from 'src/app/services/room/room.service';
import { SoloClientRoom, SoloClientState } from 'src/app/services/room/solo-client-room';
import { MeService } from 'src/app/services/state/me.service';
import { RoomType } from 'src/app/shared/room/room-models';
import { SoloRoomState } from 'src/app/shared/room/solo-room-models';

@Component({
  selector: 'app-solo-before-game-modal',
  templateUrl: './solo-before-game-modal.component.html',
  styleUrls: ['./solo-before-game-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoloBeforeGameModalComponent implements OnDestroy {

  readonly ButtonColor = ButtonColor;
  readonly Platform = Platform;

  readonly VALID_START_LEVELS = [0, 5, 9, 12, 15, 18, 19, 29];

  private gamepadSubscription: any;

  constructor(
    private readonly roomService: RoomService,
    private readonly router: Router,
    public readonly platform: PlatformInterfaceService,
    private readonly meService: MeService,
    private readonly gamepadService: GamepadService,
  ) {
    this.gamepadSubscription = this.gamepadService.onPress().subscribe(key => this.onKeyDown(key));
  }

  ngOnDestroy() {
    this.gamepadSubscription.unsubscribe();
  }

  public soloClientRoom = this.roomService.getClient<SoloClientRoom>();
  public startLevel$ = SoloClientRoom.startLevel$;

  public lastGameSummary$ = this.soloClientRoom.getState$<SoloRoomState>().pipe(
    map(state => state.lastGameSummary)
  );

  public get startLevel(): number {
    return this.startLevel$.getValue();
  }

  public set startLevel(value: number) {
    this.startLevel$.next(value);
  }

  public startGame() {
    this.soloClientRoom.startGame();
  }

  public backToSummary() {
    this.soloClientRoom.setSoloState(SoloClientState.AFTER_GAME_MODAL);
  }

  // Pressing "space" or "enter" should also trigger the next button
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.onKeyDown(event.key);
  }

  private onKeyDown(key: string) {

    const me = this.meService.getSync();
    if (!me) return;

    console.log('key', key);

    if (key === me.keybind_emu_start) {
      this.startGame();
    }

    // Left/right/up/down arrow keys to change level
    if (key === me.keybind_emu_move_left) {
      if (this.startLevel == 5) this.startLevel = 0;
      else if (this.startLevel == 9) this.startLevel = 5;
      else if (this.startLevel == 12) this.startLevel = 9;
      else if (this.startLevel == 18) this.startLevel = 15;
      else if (this.startLevel == 19) this.startLevel = 18;
      else if (this.startLevel == 29) this.startLevel = 19;
    }
    if (key === me.keybind_emu_move_right) {
      if (this.startLevel == 0) this.startLevel = 5;
      else if (this.startLevel == 5) this.startLevel = 9;
      else if (this.startLevel == 9) this.startLevel = 12;
      else if (this.startLevel == 15) this.startLevel = 18;
      else if (this.startLevel == 18) this.startLevel = 19;
      else if (this.startLevel == 19) this.startLevel = 29;
    }
    if (key === me.keybind_emu_up) {
      if (this.startLevel == 15) this.startLevel = 0;
      else if (this.startLevel == 18) this.startLevel = 5;
      else if (this.startLevel == 19) this.startLevel = 9;
      else if (this.startLevel == 29) this.startLevel = 12;
    }
    if (key === me.keybind_emu_down) {
      if (this.startLevel == 0) this.startLevel = 15;
      else if (this.startLevel == 5) this.startLevel = 18;
      else if (this.startLevel == 9) this.startLevel = 19;
      else if (this.startLevel == 12) this.startLevel = 29;
    }
  }


  exit() {
    this.router.navigate(['/']);
  }
}
