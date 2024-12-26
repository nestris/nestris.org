import { AbstractNesLayoutComponent } from '../abstract-nes-layout.component';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';
import { GameOverMode } from '../../nes-board/nes-board.component';
import { RatedMove } from 'src/app/components/ui/eval-bar/eval-bar.component';

@Component({
  selector: 'app-layout-one',
  templateUrl: './layout-one.component.html',
  styleUrls: ['./layout-one.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutOneComponent extends AbstractNesLayoutComponent implements OnChanges {
  @Input() board: TetrisBoard = new TetrisBoard();
  @Input() nextType: TetrominoType = TetrominoType.ERROR_TYPE;
  @Input() level: number = 0;
  @Input() lines: number = 0;
  @Input() score: number = 0;
  @Input() countdown?: number | string;
  @Input() trt: number = 0;
  @Input() drought?: number = undefined; // if undefined, not in drought and hidden. if drought, replace trt
  @Input() das?: number = undefined; // if undefined, not in das and hidden. if das, replace trt
  @Input() gameOver? : GameOverMode;
  @Input() gameOverShowNext: boolean = false;
  @Input() keybinds?: string;
  @Input() showEvalBar: boolean = false;
  @Input() ratedMove: RatedMove = { bestEval: null, playerEval: null };
  @Input() dimmed: boolean = false;
  @Output() clickNext = new EventEmitter<void>();


  ngOnChanges(changes: SimpleChanges): void {
    //console.log('frame layout-one changes', changes);
  }

  padScore(score: number): string {
    return score.toString().padStart(6, '0');
  }

}
