import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, combineLatestWith, map, Observable, Subscription, tap } from 'rxjs';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { Point } from 'src/app/shared/tetris/point';
import { TetrisBoard, ColorType } from 'src/app/shared/tetris/tetris-board';
import { getColorForLevel } from 'src/app/shared/tetris/tetromino-colors';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';


export enum GameOverMode {
  WIN = 'win',
  TIE = 'tie',
  LOSE = 'lose',
  TOPOUT = 'topout',
  READY = 'ready',
}

interface CanvasData {
  board: TetrisBoard;
  level: number;
}

@Component({
  selector: 'app-nes-board',
  templateUrl: './nes-board.component.html',
  styleUrls: ['./nes-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NesBoardComponent implements AfterViewInit, OnChanges, OnInit, OnDestroy {
  @ViewChild('boardCanvas') boardCanvas?: ElementRef<HTMLCanvasElement>;

  // by default, each block will take up 8 pixels. scale can adjust, respecting proportions and aspect ratio
  @Input() scale: number = 1;

  @Input() board: TetrisBoard | undefined | null = new TetrisBoard();
  @Input() canvasBoard?: Observable<TetrisBoard>; // If defined, use canvas instead of svg for faster rendering
  @Input() level: number = 18; // for deriving block color
  level$ = new BehaviorSubject<number>(18);
  canvasDataSubscription?: Subscription;

  // if true, hovered blocks will dim. hovering over active piece, if it exists, will dim
  @Input() interactable: boolean = false;

  @Input() defaultOpacity: number = 1;

  // optional current piece that, if passed in, displays the rest of the board in lower saturation
  @Input() activePiece?: MoveableTetromino;
  @Input() activePieceOpacity: number = 1;

  @Input() nextPiece?: MoveableTetromino;
  @Input() nextPieceOpacity: number = 1;

  @Input() enginePiece?: MoveableTetromino;

  @Input() countdown?: number | string; // if defined, will be shown as number in center of board

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

  ngOnChanges(changes: SimpleChanges): void {
    // Update level$ if level changes
    if (changes['level']) {
      this.level$.next(this.level);
    }
  }

  ngOnInit(): void {
    if (this.canvasBoard) {

      // merge observable with level$ to get canvasData$
      this.canvasDataSubscription = this.canvasBoard.pipe(
        combineLatestWith(this.level$),
        map(([board, level]) => ({board, level})),
      ).subscribe((data: CanvasData) => this.redrawCanvas(data));
    }
  }

  onMouseEnter(x: number, y: number) {

    if (!this.interactable || this.canvasBoard) return;

    this.hoveringBlock.emit({x, y});
  }

  onMouseLeave() {

    if (!this.interactable || this.canvasBoard) return;
    
    this.hoveringBlock.emit(undefined);
  }

  // get the color of a block at a given row and column
  // if activePiece is defined and (x,y) is in activePiece location, return that instead
  getBlockAt(x: number, y: number): ColorType | "engine" {

    if (this.enginePiece && this.enginePiece.contains(x,y)) return "engine";
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

  countdownIsString(): boolean {
    return typeof this.countdown === 'string';
  }

  trackByIndex(index: number, item: any): number {
    return index; // Or return a unique identifier for each item
  }


  ngAfterViewInit(): void {
    // if canvasBoard is defined, subscribe to it and draw the board
    if (this.boardCanvas) console.log('boardCanvas defined', this.boardCanvas);
    else console.log('boardCanvas undefined', this.boardCanvas);
  }

  redrawCanvas(data: CanvasData) {
    console.log('redrawCanvas', data);

    // Get the canvas context
    const ctx = this.boardCanvas?.nativeElement.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, this.boardWidthPixels * this.scale, this.boardHeightPixels * this.scale);

    for (let y of this.ZERO_TO_NINETEEN) {
      for (let x of this.ZERO_TO_NINE) {

        // Get the color of the block
        const color = data.board.getAt(x,y);

        const blockX = (9*x + 1) * this.scale;
        const blockY = (9*y + 1) * this.scale;

        this.drawCanvasBlock(ctx, data.level, blockX, blockY, color);
      }
    }
  }

  // draw a block on the canvas
  drawCanvasBlock(ctx: CanvasRenderingContext2D, level: number, x: number, y: number, color: ColorType) {

    // Don't draw empty blocks
    if (color === ColorType.EMPTY) return;

    // Draw background color
    ctx.fillStyle = getColorForLevel(color === ColorType.WHITE ? ColorType.PRIMARY : color, level);
    ctx.fillRect(x, y, 8 * this.scale, 8 * this.scale);
  
    // Draw white pixel at top left corner
    ctx.fillStyle = 'white';
    ctx.fillRect(x, y, 1 * this.scale, 1 * this.scale);

    // If white block, draw a white square over the non-white color excluding 1 pixel of border
    if (color === ColorType.WHITE) {
      ctx.fillStyle = 'white';
      ctx.fillRect(x + 1 * this.scale, y + 1 * this.scale, 6 * this.scale, 6 * this.scale);

    } else { // Draw a white dot at (1,1), (1,2), (2,1)
      ctx.fillStyle = 'white';
      ctx.fillRect(x + 1 * this.scale, y + 1 * this.scale, 1 * this.scale, 1 * this.scale);
      ctx.fillRect(x + 1 * this.scale, y + 2 * this.scale, 1 * this.scale, 1 * this.scale);
      ctx.fillRect(x + 2 * this.scale, y + 1 * this.scale, 1 * this.scale, 1 * this.scale);
    }
  }

  ngOnDestroy(): void {
    this.canvasDataSubscription?.unsubscribe();
  }

}
