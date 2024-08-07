import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';
import { TimePeriod } from 'src/app/shared/puzzles/attempt-stats';

@Component({
  selector: 'app-puzzles-page',
  templateUrl: './puzzles-page.component.html',
  styleUrls: ['./puzzles-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PuzzlesPageComponent {

  readonly SUMMARY_TAB_LIST = Object.values(TimePeriod);

  readonly SUMMARY_TAB_STRING: { [key in TimePeriod]: string } = {
    [TimePeriod.LIFETIME]: "Lifetime",
    [TimePeriod.TODAY]: "Today",
    [TimePeriod.THIS_WEEK]: "This Week",
  };

  public selectedSummaryTab: TimePeriod = TimePeriod.THIS_WEEK;

  constructor(
    public websocket: WebsocketService
  ) {}


}
