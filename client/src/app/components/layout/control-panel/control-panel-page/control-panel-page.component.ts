import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { NotificationService } from 'src/app/services/notification.service';
import { NotificationType } from 'src/app/shared/models/notifications';
import { PuzzleAggregate } from 'src/app/shared/puzzles/puzzle-aggregate';

@Component({
  selector: 'app-control-panel-page',
  templateUrl: './control-panel-page.component.html',
  styleUrls: ['./control-panel-page.component.scss']
})
export class ControlPanelPageComponent implements OnInit {
  
  public aggregate$ = new BehaviorSubject<PuzzleAggregate | undefined>(undefined);

  constructor(
    private fetchService: FetchService,
    private notificationService: NotificationService,
  ) {}

  async ngOnInit() {
    await this.sync();
  }

  async sync() {
    // fetch the puzzle aggregate from the server
    this.aggregate$.next(await this.fetchService.fetch<PuzzleAggregate>(Method.GET, '/api/v2/puzzle-aggregate'));
    console.log("Puzzle aggregate", this.aggregate$.getValue());
  }

  getTotals(aggregate: PuzzleAggregate) {
    return aggregate.ratings.reduce((acc, rating) => {
      acc.totalPuzzles += rating.numPuzzles;
      acc.totalAttempts += rating.totalAttempts;
      acc.totalSolves += rating.totalSolves;
      return acc;
    }, { totalPuzzles: 0, totalAttempts: 0, totalSolves: 0 });
  }

  async toggleServerRestart() {
    await this.fetchService.fetch(Method.POST, '/api/v2/server-restart-warning');
  }

  async clearUserCache() {
    await this.fetchService.fetch(Method.POST, '/api/v2/user-cache/clear');
    this.notificationService.notify(NotificationType.SUCCESS, "User cache cleared");
  }

}
