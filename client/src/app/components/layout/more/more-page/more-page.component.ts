import { ChangeDetectionStrategy, Component, HostListener, OnInit } from '@angular/core';
import { Method, fetchServer2 } from 'client/src/app/scripts/fetch-server';
import { BinaryTranscoder } from 'network-protocol/tetris-board-transcoding/binary-transcoder';
import MoveableTetromino from 'network-protocol/tetris/moveable-tetromino';
import { TetrisBoard } from 'network-protocol/tetris/tetris-board';
import { TetrominoType } from 'network-protocol/tetris/tetromino-type';
import { BehaviorSubject } from 'rxjs';
import { Move } from '../../../modals/create-puzzle-modal/create-puzzle-modal.component';
import { getTopMovesHybrid } from 'client/src/app/scripts/stackrabbit-decoder';
import { InputSpeed } from 'network-protocol/models/input-speed';
import { TopMovesHybridResponse } from 'network-protocol/stackrabbit-decoder';
import { PuzzleRating } from 'network-protocol/puzzles/puzzle-rating';
import { RatedPuzzle } from 'network-protocol/puzzles/rated-puzzle';
import { PartialRatedPuzzle } from 'server/puzzle-generation/generate-puzzles';

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

  public puzzles!: PartialRatedPuzzle[];

  public index$ = new BehaviorSubject<number>(0);

  public moveRecommendations$ = new BehaviorSubject<Move[]>([]);
  public moveRecommendationsNNB$ = new BehaviorSubject<NNBMove[]>([]);
  public moveRecommendationsShallow$ = new BehaviorSubject<Move[]>([]);
  public hoveredMove$ = new BehaviorSubject<Move | NNBMove | undefined>(undefined);

  public ratings: any = {};

  async ngOnInit() {

    this.puzzles = await fetchServer2<PartialRatedPuzzle[]>(Method.POST, "/api/v2/generate-puzzles", {
      count: 50
    });

    // count number of puzzles for each rating
    for (let rating of Object.values(PuzzleRating)) {
      this.ratings[rating as string] = this.puzzles.filter(puzzle => puzzle.rating === rating).length;
    }
    
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
    this.index$.next(Math.min(this.index$.getValue() + 1, this.puzzles.length - 1));
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

    try {
      const board = this.getBoard(this.index$.getValue());
      const currentPiece = this.getCurrentPiece(this.index$.getValue());
      const nextPiece = this.getNextPiece(this.index$.getValue());
      const response = await getTopMovesHybrid(board, 18, 0, currentPiece, nextPiece, InputSpeed.HZ_30);
      const responseShallow = await getTopMovesHybrid(board, 18, 0, currentPiece, nextPiece, InputSpeed.HZ_30, 7, 1);
      this.moveRecommendations$.next(response.nextBox);
      this.moveRecommendationsNNB$.next(response.noNextBox);
      this.moveRecommendationsShallow$.next(responseShallow.nextBox);
    } catch (e) {
      console.error("Error getting top moves hybrid", e);
    }
    
  }

  getBoard(index: number): TetrisBoard {
    return BinaryTranscoder.decode(this.puzzles[index].boardString);
  }

  getCurrentPiece(index: number): TetrominoType {
    return this.puzzles[index].current;
  }

  getNextPiece(index: number): TetrominoType {
    return this.puzzles[index].next;
  }

  getRating(index: number): PuzzleRating {
    return this.puzzles[index].rating;
  }

  hoverEngineMove(move?: Move | NNBMove) {
    this.hoveredMove$.next(move);
  }
}
