import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject, map, Observable, switchMap, tap } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-selector/solid-selector.component';
import { ApiService, GameSortKey } from 'src/app/services/api.service';
import { EVALUATION_TO_COLOR, overallAccuracyRating } from 'src/app/shared/evaluation/evaluation';
import { DBGame } from 'src/app/shared/models/db-game';
import { SortOrder } from 'src/app/shared/models/query';
import { timeAgo } from 'src/app/util/misc';

const MAX_GAMES = 20;

interface SortStrategy {
  label: string,
  key: GameSortKey,
  order: SortOrder,
}

@Component({
  selector: 'app-review-page',
  templateUrl: './review-page.component.html',
  styleUrls: ['./review-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewPageComponent implements OnInit {

  readonly ButtonColor = ButtonColor;
  readonly timeAgo = timeAgo;

  readonly sortStrategies: SortStrategy[] = [
    { label: 'Sort by time', key: GameSortKey.TIME, order: SortOrder.DESCENDING },
    { label: 'Sort by score', key: GameSortKey.SCORE, order: SortOrder.DESCENDING },
    { label: 'Sort by accuracy', key: GameSortKey.ACCURACY, order: SortOrder.DESCENDING },
  ];
  readonly sortLabels: string[] = this.sortStrategies.map(s => s.label);

  public sortIndex$!: BehaviorSubject<number>;

  // Get games for the logged in user for the selected sort strategy
  private request: (strategy: SortStrategy) => Promise<DBGame[]> = (strategy: SortStrategy) => {
    return this.apiService.getGamesForUser(undefined, strategy.key, strategy.order, MAX_GAMES)
  };
  
  // Get the games for the selected sort strategy
  public games$!: Observable<DBGame[]>;

  constructor(
    private readonly apiService: ApiService
  ) {}

  ngOnInit(): void {

    this.sortIndex$ = new BehaviorSubject(0);

    // When the sort index changes, fetch from the API to update the games based on the new sort strategy
    this.games$ = this.sortIndex$.pipe(
      map(index => this.sortStrategies[index]),
      switchMap(strategy => this.request(strategy)),
    );
  }

  getAccuracyColor(accuracy: number): string {
    return EVALUATION_TO_COLOR[overallAccuracyRating(accuracy)];
  }



}
