import { Component, HostListener } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { BinaryTranscoder } from 'src/app/shared/network/tetris-board-transcoding/binary-transcoder';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { Point } from 'src/app/shared/tetris/point';
import { ColorType, TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';

const BASE_URL = "http://localhost:3002";

enum DragMode {
  ADDING_BLOCKS = 'adding_blocks',
  REMOVING_BLOCKS = 'removing_blocks',
  NOT_DRAGGING = 'not_dragging',
}

@Component({
  selector: 'app-board-editor',
  templateUrl: './board-editor.component.html',
  styleUrls: ['./board-editor.component.scss']
})
export class BoardEditorComponent {

  private mode: DragMode = DragMode.NOT_DRAGGING;

  board$ = new BehaviorSubject<TetrisBoard>(new TetrisBoard());
  current$ = new BehaviorSubject<TetrominoType>(TetrominoType.I_TYPE);
  next$ = new BehaviorSubject<TetrominoType>(TetrominoType.I_TYPE);

  currentSolution$ = new BehaviorSubject<MoveableTetromino | undefined>(undefined);
  nextSolution$ = new BehaviorSubject<MoveableTetromino | undefined>(undefined);

  hoveredBlock$ = new BehaviorSubject<Point | undefined>(undefined);

  async evaluate() {

    const boardString = BinaryTranscoder.encode(this.board$.getValue());
    const current = this.current$.getValue();
    const next = this.next$.getValue();

    const response = await fetchServer2(Method.GET,
      `${BASE_URL}/rate-puzzle/${boardString}/${current}/${next}`
    ) as any;

    console.log(response);

    const currentSolution = response["currentSolution"];
    if (currentSolution) this.currentSolution$.next(new MoveableTetromino(
      currentSolution.tetrominoType,
      currentSolution.rotation,
      currentSolution.translateX,
      currentSolution.translateY
    ));
    

    const nextSolution = response["nextSolution"];
    if (nextSolution) this.nextSolution$.next(new MoveableTetromino(
      nextSolution.tetrominoType,
      nextSolution.rotation,
      nextSolution.translateX,
      nextSolution.translateY
    ));

    
  }

  private minoAt(block: Point): boolean {
    return this.board$.getValue().getAt(block.x, block.y) !== ColorType.EMPTY;
  }

  private setMinoAt(block: Point, filled: boolean) {

    // Clear current and next solutions
    this.currentSolution$.next(undefined);
    this.nextSolution$.next(undefined);

    const newBoard = this.board$.getValue().copy();
    newBoard.setAt(block.x, block.y, filled ? ColorType.WHITE : ColorType.EMPTY);
    this.board$.next(newBoard);
  }

  onHoveringBlock(block: Point | undefined) {
    this.hoveredBlock$.next(block);
  }

  onClick() {

    const hoveredBlock = this.hoveredBlock$.getValue();
    if (hoveredBlock === undefined) return;

    this.setMinoAt(hoveredBlock, !this.minoAt(hoveredBlock));
  }

  onMouseDown() {

    const hoveredBlock = this.hoveredBlock$.getValue();
    if (hoveredBlock === undefined) return;

    // If already dragging, cancel drag
    if (this.mode !== DragMode.NOT_DRAGGING) {
      this.mode = DragMode.NOT_DRAGGING;
      return;
    }

    // Set mode to be inverse of current block
    this.mode = this.minoAt(hoveredBlock) ? DragMode.REMOVING_BLOCKS : DragMode.ADDING_BLOCKS;
    this.setMinoAt(hoveredBlock, !this.minoAt(hoveredBlock));
  }

  onMouseMove() {

    const hoveredBlock = this.hoveredBlock$.getValue();
    if (hoveredBlock === undefined) return;

    if (this.mode === DragMode.ADDING_BLOCKS) {
      this.setMinoAt(hoveredBlock, true);
    } else if (this.mode === DragMode.REMOVING_BLOCKS) {
      this.setMinoAt(hoveredBlock, false);
    }
  }

  onMouseUp() {
    this.mode = DragMode.NOT_DRAGGING;
  }

  onCurrentClick() {
    this.current$.next((this.current$.getValue() + 1) % 7);
  }

  onNextClick() {
    this.next$.next((this.next$.getValue() + 1) % 7);
  }

  // If 'c' key is pressed, clear the board
  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'c') {
      this.board$.next(new TetrisBoard());
    }
  }

}
