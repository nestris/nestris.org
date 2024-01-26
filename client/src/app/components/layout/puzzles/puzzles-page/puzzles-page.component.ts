import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TabID } from 'client/src/app/models/tabs';
import { RoutingService } from 'client/src/app/services/routing.service';

@Component({
  selector: 'app-puzzles-page',
  templateUrl: './puzzles-page.component.html',
  styleUrls: ['./puzzles-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PuzzlesPageComponent {

  constructor(
    private routingService: RoutingService
  ) {}

  startPuzzle() {
    this.routingService.setSelectedTab({tab: TabID.PLAY_PUZZLE, params: undefined});
  }

}
