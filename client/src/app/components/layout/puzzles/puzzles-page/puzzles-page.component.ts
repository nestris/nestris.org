import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ColorType, TetrisBoard } from 'client/src/app/models/tetris/tetris-board';

@Component({
  selector: 'app-puzzles-page',
  templateUrl: './puzzles-page.component.html',
  styleUrls: ['./puzzles-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PuzzlesPageComponent {

}
