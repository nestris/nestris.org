import { ChangeDetectionStrategy, Component } from '@angular/core';

enum PuzzleTab {
  RANKED_PUZZLES = 'Ranked Puzzles',
  YOUR_PUZZLES = 'Your Puzzles',
  ATTEMPT_HISTORY = 'Attempt History'
}

@Component({
  selector: 'app-puzzles-page',
  templateUrl: './puzzles-page.component.html',
  styleUrls: ['./puzzles-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PuzzlesPageComponent {

  public tabs = Object.values(PuzzleTab);
  public selectedTab = 'Ranked Puzzles';

  readonly PuzzleTab = PuzzleTab;

  constructor(
  ) {}

}
