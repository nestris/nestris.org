import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Method, fetchServer2 } from 'client/src/app/scripts/fetch-server';
import { PuzzleRating } from 'network-protocol/puzzles/puzzle-rating';
import { PuzzleTheme } from 'network-protocol/puzzles/puzzle-theme';
import { RatedPuzzle } from 'network-protocol/puzzles/rated-puzzle';
import { BinaryTranscoder } from 'network-protocol/tetris-board-transcoding/binary-transcoder';
import { TetrisBoard } from 'network-protocol/tetris/tetris-board';
import { TetrominoType } from 'network-protocol/tetris/tetromino-type';
import { BehaviorSubject } from 'rxjs';

interface RatedPuzzleInfo {
  rating: PuzzleRating,
  theme?: PuzzleTheme,
  board: TetrisBoard,
  current: TetrominoType,
  next: TetrominoType,
  accuracy: string,
  attempts: number,
  reports: number,
  averageUserRating: string,
}

@Component({
  selector: 'app-puzzle-database',
  templateUrl: './puzzle-database.component.html',
  styleUrls: ['./puzzle-database.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PuzzleDatabaseComponent implements OnInit {

  puzzles$ = new BehaviorSubject<RatedPuzzleInfo[]>([]);

  async ngOnInit() {

    const puzzles = await fetchServer2<RatedPuzzle[]>(Method.GET, "/api/v2/rated-puzzles-list");

    // precompute the puzzle conversions
    const ratedPuzzleInfo: RatedPuzzleInfo[] = puzzles.map((puzzle) => {
      return {
        rating: puzzle.rating,
        theme: puzzle.theme,
        board: this.convertBoardString(puzzle.boardString),
        current: puzzle.current,
        next: puzzle.next,
        accuracy: this.getPuzzleAccuracy(puzzle),
        attempts: puzzle.numAttempts + puzzle.numSolves,
        reports: puzzle.numReports,
        averageUserRating: puzzle.averageUserRating?.toFixed(1) ?? "-",
      };
    });

    this.puzzles$.next(ratedPuzzleInfo);

    console.log("puzzles: ", puzzles);

  }

  private convertBoardString(boardString: string): TetrisBoard {
    return BinaryTranscoder.decode(boardString);
  }

  private getPuzzleAccuracy(puzzle: RatedPuzzle): string {
    if (puzzle.numAttempts === 0) return "-";

    const accuracy = puzzle.numSolves / (puzzle.numAttempts + puzzle.numSolves);
    return `${(accuracy * 100).toFixed(0)}%`;
  }

}
