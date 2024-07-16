import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimerComponent {

  @Input() currentTime: number = 0;
  @Input() maxTime!: number;

}
