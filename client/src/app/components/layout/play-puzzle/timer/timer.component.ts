import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PuzzleService } from 'client/src/app/services/puzzle.service';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimerComponent {

  public maxTime: number;

  constructor(
    public puzzleService: PuzzleService,
  ) {
    this.maxTime = this.puzzleService.getPuzzleTimeLimit();
  }

}
