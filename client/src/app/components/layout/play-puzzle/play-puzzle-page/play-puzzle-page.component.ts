import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Point } from 'client/src/app/models/point';
import { PuzzleDefinition } from 'client/src/app/models/puzzles/puzzle';
import { TabID } from 'client/src/app/models/tabs';
import MoveableTetromino from 'client/src/app/models/tetris/moveable-tetromino';
import { TetrisBoard } from 'client/src/app/models/tetris/tetris-board';
import { TetrominoType } from 'client/src/app/models/tetris/tetromino-type';
import { RoutingService } from 'client/src/app/services/routing.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-play-puzzle-page',
  templateUrl: './play-puzzle-page.component.html',
  styleUrls: ['./play-puzzle-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayPuzzlePageComponent {

  puzzle: PuzzleDefinition;

  placedFirstPiece?: MoveableTetromino;
  placedSecondPiece?: MoveableTetromino;

  hoveredPiece = new BehaviorSubject<MoveableTetromino | undefined>(undefined);
  hoveredBlock?: Point;

  rotation: number = 0;

  constructor(
    private routingService: RoutingService,
  ) {

    this.puzzle = {
      board: new TetrisBoard(),
      currentType: TetrominoType.I_TYPE,
      nextType: TetrominoType.J_TYPE,
      correctCurrentPlacement: new MoveableTetromino(TetrominoType.I_TYPE, 0, 0, 0),
      correctNextPlacement: new MoveableTetromino(TetrominoType.J_TYPE, 0, 0, 0),
      elo: 1000
    }

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

  // recalculate this.hoveredPiece based on this.hoveredBlock
  computeHoveredPiece() {

    // if not hovering over a block, no piece is hovered
    if (this.hoveredBlock === undefined) {
      this.hoveredPiece.next(undefined);
      console.log("hoveredPiece", this.hoveredPiece.getValue());
      return;
    }

    const x = this.hoveredBlock.x - 2;
    const y = this.hoveredBlock.y - 2;
    const MT = new MoveableTetromino(this.puzzle.currentType, this.rotation, x, y);
    
    // attempt to find a valid placement for the piece
    MT.moveIntoBounds();
    MT.kickToValidPlacement(this.puzzle.board);

    // update hovered piece
    this.hoveredPiece.next(MT);

    console.log("hoveredPiece", this.hoveredPiece.getValue());

  }

}
