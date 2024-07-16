import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonColor } from '../../ui/solid-button/solid-button.component';
import { Point } from 'src/app/models/point';
import { fetchServer, Method } from 'src/app/scripts/fetch-server';
import { getTopMovesHybrid } from 'src/app/scripts/stackrabbit-decoder';
import { CreatePuzzleRestoreService } from 'src/app/services/create-puzzle-restore.service';
import { ModalManagerService } from 'src/app/services/modal-manager.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { InputSpeed } from 'src/app/shared/models/input-speed';
import { BinaryTranscoder } from 'src/app/shared/network/tetris-board-transcoding/binary-transcoder';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { TetrisBoard, ColorType } from 'src/app/shared/tetris/tetris-board';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';

export interface Move {
  firstPlacement: MoveableTetromino;
  secondPlacement: MoveableTetromino;
  score: number;
}

@Component({
  selector: 'app-create-puzzle-modal',
  templateUrl: './create-puzzle-modal.component.html',
  styleUrls: ['./create-puzzle-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePuzzleModalComponent implements OnInit, OnDestroy {

  readonly ButtonColor = ButtonColor;
  readonly TetrominoType = TetrominoType;

  public currentType$ = new BehaviorSubject<TetrominoType>(TetrominoType.J_TYPE);
  public nextType$ = new BehaviorSubject<TetrominoType>(TetrominoType.L_TYPE);
  public board$ = new BehaviorSubject<TetrisBoard>(new TetrisBoard());

  public hoveredBlock?: Point;
  private dragBlockIsFilled = false;
  private dragging = false;

  private boundMouseUp: (event: MouseEvent) => void;

  public moveRecommendations$ = new BehaviorSubject<Move[]>([]);
  public hoveredMove$ = new BehaviorSubject<Move | undefined>(undefined);

  public submittingPuzzle$ = new BehaviorSubject<boolean>(false);


  constructor(
    public websocketService: WebsocketService,
    private modalService: ModalManagerService,
    private restore: CreatePuzzleRestoreService,
    private route: Router
  ) {
    this.boundMouseUp = this.onMouseUp.bind(this);
  }

  // save the current board state when modal is closed
  ngOnDestroy(): void {
    console.log("Saving board state");
    this.restore.save(this.board$.getValue(), this.currentType$.getValue(), this.nextType$.getValue());
  }

  // restore the previous board state when modal is opened
  ngOnInit(): void {

    console.log("Restoring board state");
    const [board, current, next] = this.restore.restore();
    this.board$.next(board);
    this.currentType$.next(current);
    this.nextType$.next(next);

    this.analyzePuzzle();
  }


  // cycle through the seven tetromino types
  toggleType(event: MouseEvent, type: BehaviorSubject<TetrominoType>) {
    const currentType = type.getValue();
    const nextType = (currentType + 1) % 7;
    type.next(nextType);

    event.stopPropagation(); // capture the click event so it doesn't bubble up to the parent

    this.analyzePuzzle();
  }

  resetBoard() {
    this.board$.next(new TetrisBoard());
    this.analyzePuzzle();
  }

  
  onMouseDown() {

    // not mouse down over a block
    if (!this.hoveredBlock) return;

    this.dragging = true;

    this.dragBlockIsFilled = this.board$.getValue().getAt(this.hoveredBlock.x, this.hoveredBlock.y) === ColorType.EMPTY;
    this.board$.getValue().setAt(this.hoveredBlock.x, this.hoveredBlock.y, this.dragBlockIsFilled ? ColorType.WHITE : ColorType.EMPTY);
    this.board$.next(this.board$.getValue());

    window.addEventListener('mouseup', this.boundMouseUp);

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
    window.removeEventListener('mouseup', this.boundMouseUp);

    event.stopPropagation(); // capture the click event so it doesn't bubble up to the parent

    this.analyzePuzzle();
  }

  hoverEngineMove(move?: Move) {
    this.hoveredMove$.next(move);
  }

  async analyzePuzzle() {

    console.log("Analyzing puzzle");

    this.moveRecommendations$.next([]);

    const response = await getTopMovesHybrid(this.board$.getValue(), 18, 0, this.currentType$.getValue(), this.nextType$.getValue(), InputSpeed.HZ_30);
    this.moveRecommendations$.next(response.nextBox);
  }

  async generatePuzzle() {

    // only generate if there are move recommendations
    if (this.moveRecommendations$.getValue().length === 0) {
      console.error("Cannot generate puzzle: no move recommendations");
      return;
    }

    if (!this.websocketService.isSignedIn()) {
      console.error("Cannot generate puzzle: not signed in");
      return;
    }

    const username = this.websocketService.getUsername();
    const move = this.moveRecommendations$.getValue()[0];

    this.submittingPuzzle$.next(true);

    // submit POST for puzzle to server
    const response = await fetchServer(Method.POST, 'api/v2/puzzle', {
      username: username,
      board: BinaryTranscoder.encode(this.board$.getValue()),
      currentPiece: this.currentType$.getValue(),
      nextPiece: this.nextType$.getValue(),
      r1: move.firstPlacement.getRotation(),
      x1: move.firstPlacement.getTranslateX(),
      y1: move.firstPlacement.getTranslateY(),
      r2: move.secondPlacement.getRotation(),
      x2: move.secondPlacement.getTranslateX(),
      y2: move.secondPlacement.getTranslateY(),
      elo: 1000
    });

    // stop the loading spinner
    this.submittingPuzzle$.next(false);

    // on submitting puzzle, reset board to empty while keeping the current and next tetromino types
    this.board$.next(new TetrisBoard());

    // hide the modal
    this.modalService.hideModal();

    console.log(response);
  }

}
