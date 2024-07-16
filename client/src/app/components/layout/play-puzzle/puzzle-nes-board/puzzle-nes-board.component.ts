import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Point } from 'src/app/models/point';
import { PuzzleSubmission } from 'src/app/models/puzzles/puzzle';
import { BinaryTranscoder } from 'src/app/shared/network/tetris-board-transcoding/binary-transcoder';
import { GenericPuzzle } from 'src/app/shared/puzzles/generic-puzzle';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';


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
export class PuzzleNesBoardComponent implements OnInit {

  @Input() scale: number = 1;

  @Input() puzzle!: GenericPuzzle;
  @Output() submitPuzzle = new EventEmitter<PuzzleSubmission>();

  @Input() undo$?: Subject<void>;
  @Output() canUndo = new EventEmitter<boolean>();

  placedFirstPiece$ = new BehaviorSubject<MoveableTetromino | undefined>(undefined);
  placedSecondPiece$ = new BehaviorSubject<MoveableTetromino | undefined>(undefined);

  hoveredPiece$ = new BehaviorSubject<MoveableTetromino | undefined>(undefined);
  hoveredBlock?: Point;

  currentBoard$ = new BehaviorSubject<TetrisBoard | undefined>(undefined);

  rotation: number = 0;

  ngOnInit(): void {

    // initialize board
    
    this.currentBoard$.next(BinaryTranscoder.decode(this.puzzle.boardString));

    // when undo$ emits, undo the first piece placement
    if (this.undo$ !== undefined) {
      this.undo$.subscribe(() => {
        this.undo();
      });
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

    if (event.key === 'z') {
      this.rotation = (this.rotation + 3) % 4;
      this.computeHoveredPiece();
    } else if (event.key === 'x') {
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
    
    if ([TetrominoType.J_TYPE, TetrominoType.L_TYPE, TetrominoType.T_TYPE].includes(piece)) {
      y += 1;
    }

    const MT = new MoveableTetromino(piece, this.rotation, x, y);
    
    // attempt to find a valid placement for the piece
    MT.moveIntoBounds();
    MT.kickToValidPlacement(this.currentBoard$.getValue()!);

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
    this.currentBoard$.next(BinaryTranscoder.decode(this.puzzle.boardString)); // reset board
    this.rotation = 0; // reset rotation
    this.computeHoveredPiece(); // update hovered piece

    this.canUndo.next(false);
  }

}
