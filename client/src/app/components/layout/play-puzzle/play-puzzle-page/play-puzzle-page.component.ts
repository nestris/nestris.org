import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Host, HostListener } from '@angular/core';
import { Point } from 'client/src/app/models/point';
import { PuzzleDefinition } from 'client/src/app/models/puzzles/puzzle';
import { TabID } from 'client/src/app/models/tabs';
import MoveableTetromino from 'client/src/app/models/tetris/moveable-tetromino';
import { TetrisBoard } from 'client/src/app/models/tetris/tetris-board';
import { TetrominoType } from 'client/src/app/models/tetris/tetromino-type';
import { PuzzleService } from 'client/src/app/services/puzzle.service';
import { RoutingService } from 'client/src/app/services/routing.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-play-puzzle-page',
  templateUrl: './play-puzzle-page.component.html',
  styleUrls: ['./play-puzzle-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayPuzzlePageComponent implements AfterViewInit {

  placedFirstPiece?: MoveableTetromino;
  placedSecondPiece?: MoveableTetromino;

  hoveredPiece = new BehaviorSubject<MoveableTetromino | undefined>(undefined);
  hoveredBlock?: Point;

  currentBoard?: TetrisBoard;

  rotation: number = 0;

  constructor(
    private routingService: RoutingService,
    public puzzleService: PuzzleService,
  ) {

  }

  ngAfterViewInit() {
    const puzzle = {
      board: new TetrisBoard(),
      currentType: TetrominoType.T_TYPE,
      nextType: TetrominoType.J_TYPE,
      correctCurrentPlacement: new MoveableTetromino(TetrominoType.I_TYPE, 0, 0, 0),
      correctNextPlacement: new MoveableTetromino(TetrominoType.J_TYPE, 0, 0, 0),
      elo: 1000
    }

    this.puzzleService.startPuzzle(puzzle);
    this.currentBoard = this.puzzleService.getPuzzle()!.board.copy();
  }

  exitFullscreen() {
    // go back to previous tab. if no previous tab, go to home
    const lastTab = this.routingService.getLastTab() ?? TabID.HOME;
    console.log("exitFullscreen", lastTab);
    this.routingService.setSelectedTab({tab: lastTab, params: undefined});
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
    if (this.placedFirstPiece !== undefined && this.placedSecondPiece !== undefined) {
      this.hoveredPiece.next(undefined);
      return;
    }

    // if not hovering over a block, no piece is hovered
    if (this.hoveredBlock === undefined) {
      this.hoveredPiece.next(undefined);
      return;
    }

    let x = this.hoveredBlock.x - 2;
    let y = this.hoveredBlock.y - 2;
    const piece = this.getActivePieceType()!;
    
    if ([TetrominoType.J_TYPE, TetrominoType.L_TYPE, TetrominoType.T_TYPE].includes(piece)) {
      y += 1;
    }

    const MT = new MoveableTetromino(piece, this.rotation, x, y);
    
    // attempt to find a valid placement for the piece
    MT.moveIntoBounds();
    MT.kickToValidPlacement(this.currentBoard!);

    // update hovered piece
    this.hoveredPiece.next(MT);

  }
  
  getActivePieceType(): TetrominoType | undefined {
    const puzzle = this.puzzleService.getPuzzle();
    if (puzzle === undefined) return undefined;
    return (this.placedFirstPiece === undefined) ? puzzle.currentType : puzzle.nextType;
  }

  // if clicking and hovering with valid piece placement, place the piece
  onClickBoard() {

    const puzzle = this.puzzleService.getPuzzle();
    
    if (puzzle === undefined) return;

    // if not hovering over a block, do nothing
    if (this.hoveredPiece.getValue() === undefined) return;

    // if not hovering over a valid piece placement, do nothing
    if (!this.hoveredPiece.getValue()!.isValidPlacement(puzzle.board)) return;

    // place the piece
    if (this.placedFirstPiece === undefined) { // placing first piece
      this.placedFirstPiece = this.hoveredPiece.getValue()!.copy();
      this.placedFirstPiece.blitToBoard(this.currentBoard!);
      this.currentBoard!.processLineClears();
      this.rotation = 0;
    } else if (this.placedSecondPiece === undefined) { // placing second piece
      this.placedSecondPiece = this.hoveredPiece.getValue()!.copy();
      this.placedSecondPiece.blitToBoard(this.currentBoard!);
      this.currentBoard!.processLineClears();
      this.rotation = 0;
    } else {
      this.puzzleService.submitPuzzle(this.placedFirstPiece, this.placedSecondPiece);
      return; // do nothing if both pieces are already placed
    }

    // update hovered piece
    this.computeHoveredPiece();

  }

  // only show undo button if placed first piece but not second piece
  showUndoButton(): boolean {
    return (this.placedFirstPiece !== undefined) && (this.placedSecondPiece === undefined);
  }

  // undo the first piece placement
  undo() {
    if (!this.showUndoButton()) return;

    this.placedFirstPiece = undefined; // reset first piece placement
    this.currentBoard = this.puzzleService.getPuzzle()!.board.copy(); // reset board
    this.rotation = 0; // reset rotation
    this.computeHoveredPiece(); // update hovered piece
  }
}
