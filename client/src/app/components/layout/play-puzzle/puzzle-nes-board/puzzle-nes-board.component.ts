import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { PuzzleSubmission } from 'src/app/models/puzzles/puzzle';
import { PuzzleRating } from 'src/app/shared/puzzles/puzzle-rating';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { Point } from 'src/app/shared/tetris/point';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';
import { PuzzleData } from '../play-puzzle-page/play-puzzle-page.component';


/*
Smart component that handles the logic for the puzzle board.
Takes in a puzzle definition, and emits a puzzle submission when the puzzle is completed.
Takes in an undo$ subject, and subscribes to it to undo the first piece placement when it emits.
*/
@Component({
  selector: 'app-puzzle-nes-board',
  templateUrl: './puzzle-nes-board.component.html',
  styleUrls: ['./puzzle-nes-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PuzzleNesBoardComponent implements OnInit, OnDestroy {

  readonly PuzzleRating = PuzzleRating;

  @Input() scale: number = 1;
  @Input() level: number = 18;

  @Input() puzzle!: PuzzleData;
  @Input() rotateLeftKeybind: string = 'z';
  @Input() rotateRightKeybind: string = 'x';
  @Output() submitPuzzle = new EventEmitter<PuzzleSubmission>();

  @Input() undo$?: Subject<void>;
  @Output() canUndo = new EventEmitter<boolean>();

  placedFirstPiece$ = new BehaviorSubject<MoveableTetromino | undefined>(undefined);
  placedSecondPiece$ = new BehaviorSubject<MoveableTetromino | undefined>(undefined);

  hoveredPiece$ = new BehaviorSubject<MoveableTetromino | undefined>(undefined);
  hoveredBlock?: Point;

  currentBoard$ = new BehaviorSubject<TetrisBoard | undefined>(undefined);

  rotation: number = 0;

  undoSubscription?: any;


  ngOnInit(): void {

    // initialize board
    
    this.currentBoard$.next(this.puzzle.board.copy());

    // when undo$ emits, undo the first piece placement
    if (this.undo$ !== undefined) {
      this.undoSubscription = this.undo$.subscribe(() => {
        this.undo();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.undoSubscription !== undefined) {
      this.undoSubscription.unsubscribe();
    }
  }

  // called by template when hovering over a block, or undefined if not hovering over a block
  onHoveringBlock(block: Point | undefined) {
    this.hoveredBlock = block;
    this.computeHoveredPiece();
  }

  // if Z or X pressed, rotate the active piece
  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {

    const key = event.key.toLowerCase();

    if (key === this.rotateLeftKeybind.toLowerCase()) {
      this.rotation = (this.rotation + 3) % 4;
      this.computeHoveredPiece();
    } else if (key === this.rotateRightKeybind.toLowerCase()) {
      this.rotation = (this.rotation + 1) % 4;
      this.computeHoveredPiece();
    }

  }

  // recalculate this.hoveredPiece based on this.hoveredBlock
  computeHoveredPiece() {

    // if both pieces are already placed, no piece is hovered
    if (this.placedFirstPiece$.getValue() !== undefined && this.placedSecondPiece$.getValue() !== undefined) {
      this.hoveredPiece$.next(undefined);
      return;
    }

    // if not hovering over a block, no piece is hovered
    if (this.hoveredBlock === undefined) {
      this.hoveredPiece$.next(undefined);
      return;
    }

    let x = this.hoveredBlock.x - 2;
    let y = this.hoveredBlock.y - 2;
    const piece = this.getActivePieceType();
    if (piece === undefined) {
      this.hoveredPiece$.next(undefined);
      return;
    }
    
    // Empirical testing shows that this leads to the most intuitive user experience for mapping
    // mouse position to piece placement
    if ([TetrominoType.J_TYPE, TetrominoType.L_TYPE, TetrominoType.T_TYPE].includes(piece)) {
      y += 1;
    }

    if ([TetrominoType.Z_TYPE, TetrominoType.S_TYPE, TetrominoType.I_TYPE].includes(piece) && this.rotation % 2 === 1) {
      y += 1;
    }

    const MT = new MoveableTetromino(piece, this.rotation, x, y);
    
    // attempt to find a valid placement for the piece
    MT.moveIntoBounds();
    MT.kickToValidPlacement(this.currentBoard$.getValue()!, this.hoveredBlock.x, this.hoveredBlock.y, piece, this.rotation);

    // update hovered piece
    this.hoveredPiece$.next(MT);

  }
  
  getActivePieceType(): TetrominoType | undefined {
    if (this.placedFirstPiece$.getValue() === undefined) return this.puzzle.current;
    if (this.placedSecondPiece$.getValue() === undefined) return this.puzzle.next;
    return undefined;
  }

  // if clicking and hovering with valid piece placement, place the piece
  onClickBoard() {
    
    // if not hovering over a block, do nothing
    if (this.hoveredPiece$.getValue() === undefined) return;

    // if not hovering over a valid piece placement, do nothing
    if (!this.hoveredPiece$.getValue()!.isValidPlacement(this.currentBoard$.getValue()!)) return;

    // place the piece
    if (this.placedFirstPiece$.getValue() === undefined) { // placing first piece
      const placedFirstPiece = this.hoveredPiece$.getValue()!.copy();
      placedFirstPiece.blitToBoard(this.currentBoard$.getValue()!);

      const newBoard = this.currentBoard$.getValue()!.copy();
      newBoard.processLineClears();
      this.currentBoard$.next(newBoard);

      this.rotation = 0;
      this.placedFirstPiece$.next(placedFirstPiece);
      this.canUndo.next(true); // after placing first piece, can undo it

    } else if (this.placedSecondPiece$.getValue() === undefined) { // placing second piece
      const placedSecondPiece = this.hoveredPiece$.getValue()!.copy();
      placedSecondPiece.blitToBoard(this.currentBoard$.getValue()!);

      const newBoard = this.currentBoard$.getValue()!.copy();
      newBoard.processLineClears();
      this.currentBoard$.next(newBoard);

      this.rotation = 0;
      this.placedSecondPiece$.next(placedSecondPiece);

      // disable undo
      this.canUndo.next(false);

      // submit the puzzle
      this.submitPuzzle.emit({
        firstPiece: this.placedFirstPiece$.getValue(),
        secondPiece: this.placedSecondPiece$.getValue()
      });

    } else {
      return;
    }

    // update hovered piece
    this.computeHoveredPiece();

  }


  // undo the first piece placement
  undo() {
    if (!(this.placedFirstPiece$.getValue() !== undefined) && (this.placedSecondPiece$.getValue() === undefined)) return;

    this.placedFirstPiece$.next(undefined); // reset first piece placement
    this.currentBoard$.next(this.puzzle.board.copy()); // reset board
    this.rotation = 0; // reset rotation
    this.computeHoveredPiece(); // update hovered piece

    this.canUndo.next(false);
  }

}
