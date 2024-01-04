import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import MoveableTetromino from 'client/src/app/models/tetris/moveable-tetromino';
import { TetrisBoard } from 'client/src/app/models/tetris/tetris-board';

@Component({
  selector: 'app-nes-board',
  templateUrl: './nes-board.component.html',
  styleUrls: ['./nes-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NesBoardComponent {
  // by default, each block will take up 8 pixels. scale can adjust, respecting proportions and aspect ratio
  @Input() scale: number = 1;

  @Input() board: TetrisBoard = new TetrisBoard();
  @Input() level: number = 18; // for deriving block color

  // if true, hovered blocks will dim. hovering over active piece, if it exists, will dim
  @Input() interactable: boolean = false;

  // optional current piece that, if passed in, displays the rest of the board in lower saturation
  @Input() activePiece?: MoveableTetromino; // TODO

  public readonly boardWidthPixels = 8*10 + 11; // 10 blocks 8px wide plus 1px gap and 1px margins
  public readonly boardHeightPixels = 8*20 + 21; // 20 blocks 8px wide plus 1px gap and 1px margins

  // for iterating over rows and columns in template
  public readonly ZERO_TO_NINE: number[] = Array(10).fill(0).map((x, i) => i);
  public readonly ZERO_TO_NINETEEN: number[] = Array(20).fill(0).map((x, i) => i);
}
