import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { Platform, PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { RoomService } from 'src/app/services/room/room.service';
import { SoloClientRoom } from 'src/app/services/room/solo-client-room';
import { RoomType } from 'src/app/shared/room/room-models';

@Component({
  selector: 'app-solo-before-game-modal',
  templateUrl: './solo-before-game-modal.component.html',
  styleUrls: ['./solo-before-game-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoloBeforeGameModalComponent {

  readonly ButtonColor = ButtonColor;
  readonly Platform = Platform;

  readonly VALID_START_LEVELS = [0, 5, 9, 12, 15, 18, 19, 29]

  //selectedLevel$ = new BehaviorSubject<number>(18);

  constructor(
    private readonly roomService: RoomService,
    private readonly router: Router,
    public readonly platform: PlatformInterfaceService
  ) { }

  public soloClientRoom = this.roomService.getClient<SoloClientRoom>();
  public startLevel$ = SoloClientRoom.startLevel$;

  public get startLevel(): number {
    return this.startLevel$.getValue();
  }

  public set startLevel(value: number) {
    this.startLevel$.next(value);
  }

  public startGame() {
      this.soloClientRoom.startGame();
  }

  // Pressing "space" or "enter" should also trigger the next button
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter') {
      console.log('click solo before game');
      event.preventDefault();
      event.stopImmediatePropagation();
      this.startGame();
    }

    // Left/right/up/down arrow keys to change level
    if (event.key === 'ArrowLeft') {
      if (this.startLevel == 5) this.startLevel = 0;
      else if (this.startLevel == 9) this.startLevel = 5;
      else if (this.startLevel == 12) this.startLevel = 9;
      else if (this.startLevel == 18) this.startLevel = 15;
      else if (this.startLevel == 19) this.startLevel = 18;
      else if (this.startLevel == 29) this.startLevel = 19;
    }
    if (event.key === 'ArrowRight') {
      if (this.startLevel == 0) this.startLevel = 5;
      else if (this.startLevel == 5) this.startLevel = 9;
      else if (this.startLevel == 9) this.startLevel = 12;
      else if (this.startLevel == 15) this.startLevel = 18;
      else if (this.startLevel == 18) this.startLevel = 19;
      else if (this.startLevel == 19) this.startLevel = 29;
    }
    if (event.key === 'ArrowUp') {
      if (this.startLevel == 15) this.startLevel = 0;
      else if (this.startLevel == 18) this.startLevel = 5;
      else if (this.startLevel == 19) this.startLevel = 9;
      else if (this.startLevel == 29) this.startLevel = 12;
    }
    if (event.key === 'ArrowDown') {
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
