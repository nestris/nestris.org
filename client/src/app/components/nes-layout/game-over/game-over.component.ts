import { Component, EventEmitter, Host, HostListener, Input, Output } from '@angular/core';
import { GameOverMode } from '../nes-board/nes-board.component';
import { eventIsForInput } from 'src/app/util/misc';
import { MeService } from 'src/app/services/state/me.service';
import { GamepadService } from 'src/app/services/gamepad.service';

@Component({
  selector: 'app-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['./game-over.component.scss']
})
export class GameOverComponent {
  @Input() mode?: GameOverMode;
  @Input() showNext: boolean = false;
  @Output() clickNext = new EventEmitter<void>();

  private gamepadSubscription: any;

  constructor(
    private meService: MeService,
    private gamepadService: GamepadService
  ) {

    const me = this.meService.getSync();

    this.gamepadSubscription = this.gamepadService.onPress().subscribe(key => {
      if (this.mode && me && key === me.keybind_emu_start) this.clickNext.emit();
    });
  } 

  ngOnDestroy() {
    this.gamepadSubscription.unsubscribe();
  }

  getText(mode?: GameOverMode): string {
    switch (mode) {
      case GameOverMode.WIN:
        return 'VICTORY';
      case GameOverMode.TIE:
        return 'DRAW';
      case GameOverMode.LOSE:
        return 'DEFEAT';
      case GameOverMode.TOPOUT:
        return 'GAME OVER';
      case GameOverMode.READY:
        return 'READY?';
      default:
        return '';
    }
  }

  getButton(mode?: GameOverMode): string {
    if (mode === GameOverMode.READY) {
      return 'READY';
    }
    return 'NEXT';
  }


  // Pressing "space" or "enter" should also trigger the next button
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {

    // Ignore if event is for an input
    if (eventIsForInput(event)) return;

    const me = this.meService.getSync();
    if (!me) return;

    if (this.mode && (event.key === me.keybind_emu_start)) {
      console.log('click game over');
      event.preventDefault();
      event.stopImmediatePropagation();
      this.clickNext.emit();

    }
  }
}
