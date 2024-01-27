import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-elo-rating',
  templateUrl: './elo-rating.component.html',
  styleUrls: ['./elo-rating.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EloRatingComponent {

  @Input() rating!: number;
  @Input() increase!: number;
  @Input() decrease!: number;

}
