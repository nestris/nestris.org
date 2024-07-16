import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PuzzleRating } from 'src/app/shared/puzzles/puzzle-rating';

@Component({
  selector: 'app-rating-stars',
  templateUrl: './rating-stars.component.html',
  styleUrls: ['./rating-stars.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatingStarsComponent {
  @Input() width: number = 100;
  @Input() rating: PuzzleRating = PuzzleRating.UNRATED;

  readonly PuzzleRating = PuzzleRating;
}
