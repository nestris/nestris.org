import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonColor } from '../../ui/solid-button/solid-button.component';
import { TetrominoType } from 'client/src/app/models/tetris/tetromino-type';
import { BehaviorSubject } from 'rxjs';
import { TetrisBoard } from 'client/src/app/models/tetris/tetris-board';

@Component({
  selector: 'app-create-puzzle-modal',
  templateUrl: './create-puzzle-modal.component.html',
  styleUrls: ['./create-puzzle-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePuzzleModalComponent {

  readonly ButtonColor = ButtonColor;
  readonly TetrominoType = TetrominoType;

  public currentType$: BehaviorSubject<TetrominoType> = new BehaviorSubject<TetrominoType>(TetrominoType.J_TYPE);
  public nextType$: BehaviorSubject<TetrominoType> = new BehaviorSubject<TetrominoType>(TetrominoType.J_TYPE);
  public board$: BehaviorSubject<TetrisBoard> = new BehaviorSubject<TetrisBoard>(new TetrisBoard());

  // cycle through the seven tetromino types
  toggleType(event: MouseEvent, type: BehaviorSubject<TetrominoType>) {
    const currentType = type.getValue();
    const nextType = (currentType + 1) % 7;
    type.next(nextType);

    event.stopPropagation(); // capture the click event so it doesn't bubble up to the parent
  }

}
