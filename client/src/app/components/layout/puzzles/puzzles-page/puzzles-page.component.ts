import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ColorType, TetrisBoard } from 'client/src/app/models/tetris/tetris-board';

@Component({
  selector: 'app-puzzles-page',
  templateUrl: './puzzles-page.component.html',
  styleUrls: ['./puzzles-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PuzzlesPageComponent {

  public board: TetrisBoard;

  constructor() {

    // test random board
    this.board = new TetrisBoard();
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const r = Math.random();
        if (r > 0.8) this.board.setAt(x,y, ColorType.WHITE);
        else if (r > 0.6) this.board.setAt(x,y, ColorType.PRIMARY);
        else if (r > 0.4) this.board.setAt(x,y, ColorType.SECONDARY);
      }
    }
  }

}
