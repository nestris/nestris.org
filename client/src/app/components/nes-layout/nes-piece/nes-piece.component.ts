import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ColorType } from 'src/app/shared/tetris/tetris-board';
import { getColorTypeForTetromino } from 'src/app/shared/tetris/tetromino-colors';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';
import { Tetromino } from 'src/app/shared/tetris/tetrominos';


@Component({
  selector: 'app-nes-piece',
  templateUrl: './nes-piece.component.html',
  styleUrls: ['./nes-piece.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NesPieceComponent implements OnChanges {
  // by default, each block will take up 8 pixels. scale can adjust, respecting proportions and aspect ratio
  @Input() scale: number = 1;

  @Input() piece?: TetrominoType = TetrominoType.ERROR_TYPE;
  @Input() level: number = 18;

  @Input() animateOpacity: boolean = false;
  @Input() opacity: number = 1;

  // login page has white style
  @Input() isLoginPage: boolean = false;

  // the smallest grid that can fit the next box piece at first rotation
  // recalculated every time the piece changes
  public nextBox?: ColorType[][];

  // for iterating over rows and columns in template. computed in ngOnChanges
  public ROWS!: number[];
  public COLS!: number[];

  // for viewport width/height. computed in ngOnChanges
  public boardWidthPixels!: number;
  public boardHeightPixels!: number;

  readonly ColorType = ColorType;

  constructor(private cdr: ChangeDetectorRef) {

  }

  ngOnChanges(): void {

    // if error type, do not display anything
    if (this.piece === TetrominoType.ERROR_TYPE || this.piece === undefined) {
      this.nextBox = undefined;
      return;
    }

    const color = getColorTypeForTetromino(this.piece);

    const blockset = Tetromino.getPieceByType(this.piece).blockSet[0]; // the first rotation
    const width = blockset.maxX - blockset.minX + 1;
    const height = blockset.maxY - blockset.minY + 1;

    // populate empty next box but with correct size
    const nextBox: ColorType[][] = [];
    for (let y = 0; y < height; y++) {
      let row: ColorType[] = [];
      for (let x = 0; x < width; x++) {
        row.push(ColorType.EMPTY);
      }
      nextBox.push(row);
    }

    // for each block in the blockset, assign the proper color
    blockset.blocks.forEach((block) => {

      // normalize so left-most block is (0,0)
      const x = block.x - blockset.minX;
      const y = block.y - blockset.minY;

      // assign block of correct color to the corresponding position in next box
      nextBox[y][x] = color;
    });

    this.COLS = Array(width).fill(0).map((x, i) => i);
    this.ROWS = Array(height).fill(0).map((x, i) => i);

    this.boardWidthPixels = 9 * width - 1;
    this.boardHeightPixels = 9 * height - 1;

    this.nextBox = nextBox;
    this.cdr.detectChanges();
  }
}
