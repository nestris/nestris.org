import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';
import { GameOverMode } from '../nes-board/nes-board.component';

/*
An abstract layout that defines the game state interface and leaves layout html and css up to implementation
To create your own layout, create a component that extends AbstractNesLayoutComponent
and build an HTML template using <app-nes-panel> and <app-nes-board> from @Inputs()
*/

@Component({
  selector: 'app-abstract-nes-layout',
  template: '',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class AbstractNesLayoutComponent {
  @Input() board: TetrisBoard = new TetrisBoard();
  @Input() nextType: TetrominoType = TetrominoType.ERROR_TYPE;
  @Input() level: number = 0;
  @Input() lines: number = 0;
  @Input() score: number = 0;
  @Input() countdown?: number;
  @Input() trt: number = 0;
  @Input() drought?: number = undefined; // if undefined, not in drought and hidden. if drought, replace trt
  @Input() das?: number = undefined; // if undefined, not in das and hidden. if das, replace trt
  @Input() gameOver? : GameOverMode;
  @Input() gameOverShowNext: boolean = false;
  @Output() clickNext = new EventEmitter<void>();
}
