import { Component, EventEmitter, Host, HostListener, Input, Output } from '@angular/core';
import { GameOverMode } from '../nes-board/nes-board.component';
import { eventIsForInput } from 'src/app/util/misc';

@Component({
  selector: 'app-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['./game-over.component.scss']
})
export class GameOverComponent {
  @Input() mode?: GameOverMode;
  @Input() showNext: boolean = false;
  @Output() clickNext = new EventEmitter<void>();

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
      default:
        return '';
    }
  }


  // Pressing "space" or "enter" should also trigger the next button
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {

    // Ignore if event is for an input
    if (eventIsForInput(event)) return;

    if (this.mode && (event.key === ' ' || event.key === 'Enter')) {
      console.log('click game over');
      event.preventDefault();
      event.stopImmediatePropagation();
      this.clickNext.emit();

    }
  }

}
