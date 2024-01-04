import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TetrisBoard } from 'client/src/app/models/tetris/tetris-board';

@Component({
  selector: 'app-nes-board',
  templateUrl: './nes-board.component.html',
  styleUrls: ['./nes-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NesBoardComponent {
  @Input() board: TetrisBoard = new TetrisBoard();
  @Input() level: number = 18; // for deriving block color

  // if true, hovered blocks will dim. hovering over active piece, if it exists, will dim
  @Input() interactable: boolean = false;

  // optional current piece that, if passed in, displays the rest of the board in lower saturation
  @Input() activePiece?: any; 
}
