import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { BinaryTranscoder } from 'src/app/shared/network/tetris-board-transcoding/binary-transcoder';
import { PuzzleRating } from 'src/app/shared/puzzles/puzzle-rating';
import { PuzzleTheme } from 'src/app/shared/puzzles/puzzle-theme';
import { RatedPuzzle } from 'src/app/shared/puzzles/rated-puzzle';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';

interface RatedPuzzleInfo {
  rating: PuzzleRating,
  theme?: PuzzleTheme,
  board: TetrisBoard,
  current: TetrominoType,
  next: TetrominoType,
  accuracy: string,
  attempts: number,
  likes: number,
  dislikes: number,
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
        likes: puzzle.likes,
        dislikes: puzzle.dislikes,
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
