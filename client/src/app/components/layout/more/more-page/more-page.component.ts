import { ChangeDetectionStrategy, Component, HostListener, OnInit } from '@angular/core';
import { Method, fetchServer2 } from 'client/src/app/scripts/fetch-server';
import { BinaryTranscoder } from 'network-protocol/tetris-board-transcoding/binary-transcoder';
import MoveableTetromino from 'network-protocol/tetris/moveable-tetromino';
import { TetrisBoard } from 'network-protocol/tetris/tetris-board';
import { TetrominoType } from 'network-protocol/tetris/tetromino-type';
import { BehaviorSubject } from 'rxjs';
import { SerializedGame } from 'server/puzzle-generation/simulate-game';
import { Move } from '../../../modals/create-puzzle-modal/create-puzzle-modal.component';
import { getTopMovesHybrid } from 'client/src/app/scripts/stackrabbit-decoder';
import { InputSpeed } from 'network-protocol/models/input-speed';

export interface PuzzleEvaluation {
  best: number;
  diff: number;
  bestAdjusted: number;
  diffAdjusted: number;
  nnbRank: number;
  total: number;
}

export interface NNBMove {
  firstPlacement: MoveableTetromino;
  secondPlacement?: MoveableTetromino;
  score: number;
}

@Component({
  selector: 'app-more-page',
  templateUrl: './more-page.component.html',
  styleUrls: ['./more-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MorePageComponent implements OnInit {

  public game!: SerializedGame;

  public index$ = new BehaviorSubject<number>(0);

  public moveRecommendations$ = new BehaviorSubject<Move[]>([]);
  public moveRecommendationsNNB$ = new BehaviorSubject<NNBMove[]>([]);
  public hoveredMove$ = new BehaviorSubject<Move | NNBMove | undefined>(undefined);
  public evaluation$ = new BehaviorSubject<PuzzleEvaluation | undefined>(undefined);

  async ngOnInit() {

    this.game = await fetchServer2<SerializedGame>(Method.POST, "/api/v2/simulate-game", {
      count: 50
    });    
    
    this.updateMoveRecommendations();
  }

  // left and right arrow keys to navigate between placements
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      this.prev();
    } else if (event.key === "ArrowRight") {
      this.next();
    }
  }

  next() {
    this.index$.next(Math.min(this.index$.getValue() + 1, this.game.placements.length - 1));
    this.updateMoveRecommendations();
  }

  prev() {
    this.index$.next(Math.max(this.index$.getValue() - 1, 0));
    this.updateMoveRecommendations();
  }

  async updateMoveRecommendations() {
    this.moveRecommendations$.next([]);
    this.moveRecommendationsNNB$.next([]);
    this.hoveredMove$.next(undefined);
    this.evaluation$.next(undefined);

    const board = this.getBoard(this.index$.getValue());
    const currentPiece = this.getCurrentPiece(this.index$.getValue());
    const nextPiece = this.getNextPiece(this.index$.getValue());
    const response = await getTopMovesHybrid(board, 18, 0, currentPiece, nextPiece, InputSpeed.HZ_30);
    this.moveRecommendations$.next(response.nextBox);
    this.moveRecommendationsNNB$.next(response.noNextBox);

    let best = response.nextBox[0].score;

    let diff: number;
    if (response.nextBox.length >= 2) diff = response.nextBox[0].score - response.nextBox[1].score;
    else diff = -1;

    let nnbRank = response.noNextBox.findIndex(move => move.firstPlacement.equals(response.nextBox[0].firstPlacement));
    if (nnbRank === -1) nnbRank = response.noNextBox.length;

    // 75 / 1.1^x
    const diffAdjusted = 75 / Math.pow(1.1, diff);

    // -20*tanh(x/50)
    const bestAdjusted =  -20 * Math.tanh(best / 50);

    const total = bestAdjusted + diffAdjusted;

    this.evaluation$.next({ best, diff, bestAdjusted, diffAdjusted, nnbRank, total});

  }

  getBoard(index: number): TetrisBoard {
    return BinaryTranscoder.decode(this.game.placements[index].boardString);
  }

  getCurrentPiece(index: number): TetrominoType {
    return this.game.placements[index].current;
  }

  getNextPiece(index: number): TetrominoType {
    return this.game.placements[index].next;
  }

  getMT(index: number): MoveableTetromino {
    const placement = this.game.placements[index];
    return new MoveableTetromino(placement.current, placement.r, placement.x, placement.y);
  }

  hoverEngineMove(move?: Move | NNBMove) {
    this.hoveredMove$.next(move);
  }
}
