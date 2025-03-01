import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-correctness-icon',
  templateUrl: './correctness-icon.component.html',
  styleUrls: ['./correctness-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorrectnessIconComponent {
  @Input() correct: boolean = false;
  @Input() width: string = 'auto';

  getSrc() {
    return `./assets/img/feedback-icons/${this.correct ? 'correct' : 'incorrect'}.svg`;
  }
}
