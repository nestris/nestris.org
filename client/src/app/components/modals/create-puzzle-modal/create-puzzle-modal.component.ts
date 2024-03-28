import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonColor } from '../../ui/solid-button/solid-button.component';
import { TetrominoType } from 'client/src/app/models/tetris/tetromino-type';
import { BehaviorSubject } from 'rxjs';
import { ColorType, TetrisBoard } from 'client/src/app/models/tetris/tetris-board';
import { Point } from 'client/src/app/models/point';
import { BlockType } from 'client/src/app/models/binary-grid';

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

  public hoveredBlock?: Point;
  private dragBlockIsFilled = false;
  private dragging = false;


  // cycle through the seven tetromino types
  toggleType(event: MouseEvent, type: BehaviorSubject<TetrominoType>) {
    const currentType = type.getValue();
    const nextType = (currentType + 1) % 7;
    type.next(nextType);

    event.stopPropagation(); // capture the click event so it doesn't bubble up to the parent
  }

  
  onMouseDown() {

    // not mouse down over a block
    if (!this.hoveredBlock) return;

    this.dragging = true;

    this.dragBlockIsFilled = this.board$.getValue().getAt(this.hoveredBlock.x, this.hoveredBlock.y) === ColorType.EMPTY;
    this.board$.getValue().setAt(this.hoveredBlock.x, this.hoveredBlock.y, this.dragBlockIsFilled ? ColorType.WHITE : ColorType.EMPTY);
    this.board$.next(this.board$.getValue());

    window.addEventListener('mouseup', this.onMouseUp.bind(this));

  }

  // when dragging the mouse, set the hovered block to drag value
  onMouseMove() {
    if (!this.dragging) return;
    if (!this.hoveredBlock) return;

    this.board$.getValue().setAt(this.hoveredBlock.x, this.hoveredBlock.y, this.dragBlockIsFilled ? ColorType.WHITE : ColorType.EMPTY);
    this.board$.next(this.board$.getValue());
  }

  onMouseUp(event: MouseEvent): void {
    this.dragging = false;

    // Remove the mouseup event listener after it has been triggered
    window.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

}
