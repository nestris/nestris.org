import { ChangeDetectionStrategy, Component } from '@angular/core';

enum PuzzleTab {
  RANKED_PUZZLES = 'Rated Puzzles',
  YOUR_PUZZLES = 'Your Puzzles',
  PUZZLE_DATABASE = 'Puzzle Database'
}

export const TAB_URLS: {[key in PuzzleTab] : string } = {
  [PuzzleTab.RANKED_PUZZLES]: '/puzzles/ranked',
  [PuzzleTab.YOUR_PUZZLES]: '/puzzles/view',
  [PuzzleTab.PUZZLE_DATABASE]: '/puzzles/database'
};

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
  readonly TAB_URLS = TAB_URLS;

  constructor(
  ) {}

}
