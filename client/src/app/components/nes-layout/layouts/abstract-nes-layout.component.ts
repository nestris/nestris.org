import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TetrisBoard } from 'client/src/app/models/tetris/tetris-board';
import { TetrominoType } from 'client/src/app/models/tetris/tetromino-type';

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
  @Input() nextPiece: TetrominoType = TetrominoType.ERROR_TYPE;
  @Input() level: number = 0;
  @Input() lines: number = 0;
  @Input() score: number = 0;
  @Input() trt: number = 0;
  @Input() drought?: number = undefined; // if undefined, not in drought and hidden. if drought, replace trt
  @Input() keybindInstructions?: string; // optional instructions that would typically appear below the board
}
