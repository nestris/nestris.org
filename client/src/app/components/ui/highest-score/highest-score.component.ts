import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { numberWithCommas } from 'src/app/util/misc';

@Component({
  selector: 'app-highest-score',
  templateUrl: './highest-score.component.html',
  styleUrls: ['./highest-score.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HighestScoreComponent {
  @Input() highestScore!: number;
  @Input() size!: number;
  @Input() commas: boolean = true;

  readonly numberWithCommas = numberWithCommas;

}
