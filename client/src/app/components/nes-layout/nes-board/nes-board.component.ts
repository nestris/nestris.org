import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { Point } from 'src/app/shared/tetris/point';
import { TetrisBoard, ColorType } from 'src/app/shared/tetris/tetris-board';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';


export enum GameOverMode {
  WIN = 'win',
  TIE = 'tie',
  LOSE = 'lose',
  TOPOUT = 'topout',
}

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

  @Input() defaultOpacity: number = 1;

  // optional current piece that, if passed in, displays the rest of the board in lower saturation
  @Input() activePiece?: MoveableTetromino;
  @Input() activePieceOpacity: number = 1;

  @Input() nextPiece?: MoveableTetromino;
  @Input() nextPieceOpacity: number = 1;

  @Input() countdown?: number; // if defined, will be shown as number in center of board

  // if hidden, <ng-content> will be displayed instead of board
  @Input() hide: boolean = false;

  @Input() nextType?: TetrominoType; // if defined, will be shown at top right corner

  @Input() gameOver?: GameOverMode;
  @Input() gameOverShowNext: boolean = false;
  @Output() clickNext = new EventEmitter<void>();
  
  @Input() animateOpacity: boolean = false;

  @Input() gold: boolean = false;

  // login page has white style
  @Input() isLoginPage: boolean = false;


  @Output() hoveringBlock = new EventEmitter<Point | undefined>();

  @Output() gameOverClick = new EventEmitter<void>();

  hoveringBlock$ = this.hoveringBlock.asObservable();

  public readonly boardWidthPixels = 8*10 + 11; // 10 blocks 8px wide plus 1px gap and 1px margins
  public readonly boardHeightPixels = 8*20 + 21; // 20 blocks 8px wide plus 1px gap and 1px margins

  // for iterating over rows and columns in template
  public readonly ZERO_TO_NINE: number[] = Array(10).fill(0).map((x, i) => i);
  public readonly ZERO_TO_NINETEEN: number[] = Array(20).fill(0).map((x, i) => i);

  readonly GameOverMode = GameOverMode;

  onMouseEnter(x: number, y: number) {

    if (!this.interactable) return;

    this.hoveringBlock.emit({x, y});
  }

  onMouseLeave() {

    if (!this.interactable) return;
    
    this.hoveringBlock.emit(undefined);
  }

  // get the color of a block at a given row and column
  // if activePiece is defined and (x,y) is in activePiece location, return that instead
  getBlockAt(x: number, y: number): ColorType {

    if (this.activePiece && this.activePiece.contains(x,y)) return this.activePiece.color;
    if (this.nextPiece && this.nextPiece.contains(x,y)) return this.nextPiece.color;
    return this.board?.getAt(x,y) ?? ColorType.EMPTY;
  }

  // get the opacity of a block at a given row and column
  getOpacityAt(x: number, y: number): number {

    if (this.gameOver) return 0.2;

    if (this.activePiece && this.activePiece.contains(x,y)) return this.activePieceOpacity;
    if (this.nextPiece && this.nextPiece.contains(x,y)) return this.nextPieceOpacity;
    return this.defaultOpacity;
  }

  pointsAreEqual(p1?: Point, p2?: Point): boolean {
    if (p1 === undefined || p2 === undefined) return false;
    return p1.x === p2.x && p1.y === p2.y;
  
  }

}
