import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameOverMode } from '../nes-board/nes-board.component';

@Component({
  selector: 'app-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['./game-over.component.scss']
})
export class GameOverComponent {
  @Input() mode!: GameOverMode;
  @Input() showNext: boolean = false;
  @Output() clickNext = new EventEmitter<void>();

  getText(mode: GameOverMode): string {
    switch (mode) {
      case GameOverMode.WIN:
        return 'VICTORY';
      case GameOverMode.TIE:
        return 'DRAW';
      case GameOverMode.LOSE:
        return 'DEFEAT';
      case GameOverMode.TOPOUT:
        return 'GAME OVER';
    }
  }
}
