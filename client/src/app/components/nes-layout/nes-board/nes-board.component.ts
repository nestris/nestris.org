import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Point } from 'client/src/app/models/point';
import MoveableTetromino from 'client/src/app/models/tetris/moveable-tetromino';
import { ColorType, TetrisBoard } from 'client/src/app/models/tetris/tetris-board';
import { TetrominoType } from 'client/src/app/models/tetris/tetromino-type';

@Component({
  selector: 'app-nes-board',
  templateUrl: './nes-board.component.html',
  styleUrls: ['./nes-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NesBoardComponent {
  // by default, each block will take up 8 pixels. scale can adjust, respecting proportions and aspect ratio
  @Input() scale: number = 1;

  @Input() board: TetrisBoard | undefined | null = new TetrisBoard();
  @Input() level: number = 18; // for deriving block color

  // if true, hovered blocks will dim. hovering over active piece, if it exists, will dim
  @Input() interactable: boolean = false;

  // optional current piece that, if passed in, displays the rest of the board in lower saturation
  @Input() activePiece?: MoveableTetromino;
  @Input() activePieceOpacity: number = 1;

  // if hidden, <ng-content> will be displayed instead of board
  @Input() hide: boolean = false;

  @Input() nextPiece?: TetrominoType; // if defined, will be shown at top right corner

  @Output() hoveringBlock = new EventEmitter<Point | undefined>();

  hoveringBlock$ = this.hoveringBlock.asObservable();

  public readonly boardWidthPixels = 8*10 + 11; // 10 blocks 8px wide plus 1px gap and 1px margins
  public readonly boardHeightPixels = 8*20 + 21; // 20 blocks 8px wide plus 1px gap and 1px margins

  // for iterating over rows and columns in template
  public readonly ZERO_TO_NINE: number[] = Array(10).fill(0).map((x, i) => i);
  public readonly ZERO_TO_NINETEEN: number[] = Array(20).fill(0).map((x, i) => i);

  onMouseEnter(x: number, y: number) {
    this.hoveringBlock.emit({x, y});
  }

  onMouseLeave() {
    this.hoveringBlock.emit(undefined);
  }

  // get the color of a block at a given row and column
  // if activePiece is defined and (x,y) is in activePiece location, return that instead
  getBlockAt(x: number, y: number): ColorType {

    if (this.activePiece && this.activePiece.contains(x,y)) return this.activePiece.color;
    return this.board?.getAt(x,y) ?? ColorType.EMPTY;
  }

  // get the opacity of a block at a given row and column
  getOpacityAt(x: number, y: number): number {

    if (this.activePiece && this.activePiece.contains(x,y)) return this.activePieceOpacity;
    return 1;
  }

  pointsAreEqual(p1?: Point, p2?: Point): boolean {
    if (p1 === undefined || p2 === undefined) return false;
    return p1.x === p2.x && p1.y === p2.y;
  
  }

}
