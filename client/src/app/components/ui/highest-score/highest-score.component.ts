import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-highest-score',
  templateUrl: './highest-score.component.html',
  styleUrls: ['./highest-score.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HighestScoreComponent {
  @Input() highestScore!: number;
  @Input() size!: number;

}
