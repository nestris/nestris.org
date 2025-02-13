import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject, concat, distinctUntilChanged, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-selector/solid-selector.component';
import { ApiService, GameSortKey } from 'src/app/services/api.service';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { MeService } from 'src/app/services/state/me.service';
import { EVALUATION_TO_COLOR, overallAccuracyRating } from 'src/app/shared/evaluation/evaluation';
import { DBGame } from 'src/app/shared/models/db-game';
import { SortOrder } from 'src/app/shared/models/query';
import { numberWithCommas, timeAgo } from 'src/app/util/misc';

const MAX_GAMES = 20;

interface SortStrategy {
  label: string,
  key: GameSortKey,
  order: SortOrder,
}

interface HistogramColumn {
  count: number;
  height: number;
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
  readonly numbersWithCommas = numberWithCommas;

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

  public me$ = this.meService.get$();

  private static initialHistogram: HistogramColumn[] = Array.from({length: 17}, () => ({ count: 0, height: 0 }));
  public histogram$ = concat(
    of(ReviewPageComponent.initialHistogram),
    from(this.fetchService.fetch<number[]>(Method.GET, '/api/v2/score-histogram')).pipe(
      map(histogram => this.calculateHistogram(histogram)),
      tap((histogram) => { ReviewPageComponent.initialHistogram = histogram })
    )
  );

  private DEFAULT_CHART: DBGame[] = [];
  public chart$ = concat(
    of(this.DEFAULT_CHART),
    from(this.apiService.getGamesForUser(undefined, GameSortKey.SCORE, SortOrder.DESCENDING, 1000))
  );

  // array from 0 to 16
  public readonly HISTOGRAM_SCORE_RANGES = Array.from({length: 17}, (_, i) => i);
  public readonly HISTOGRAM_COLORS = [
    "#D75858",
    "#D76758",
    "#D77E58",
    "#D79558",
    "#D7B358",
    "#D7D258",
    "#B6D758",
    "#88D758",
    "#58D764",
    "#58D783",
    "#58D7A9",
    "#58D7CF",
    "#58C0D7",
    "#589AD7",
    "#5874D7",
    "#5A58D7",
    "#9058D7",
  ]

  constructor(
    private readonly apiService: ApiService,
    private readonly meService: MeService,
    private readonly fetchService: FetchService,
  ) {}

  ngOnInit(): void {

    this.sortIndex$ = new BehaviorSubject(0);

    // When the sort index changes, fetch from the API to update the games based on the new sort strategy
    this.games$ = this.sortIndex$.pipe(
      distinctUntilChanged(),
      map(index => this.sortStrategies[index]),
      switchMap(strategy => this.request(strategy)),
      tap(games => console.log('games', games))
    );
  }

  // Return an array of histogram columns, with height normalized to the max count and max height 1
  calculateHistogram(histogram: number[]): HistogramColumn[] {

    const maxCount = Math.max(...histogram);
    return histogram.map(count => ({
      count,
      height: Math.pow(count / maxCount, 0.5)
    }));
  }

  histogramLabel(i: number): string {
    if (i === 0) return '0';
    if (i < 10) return `${i}00k`;
    if (i === 10) return '1m';
    if (i < 16) return `1.${i - 10}m`;
    return '1.6m+';
  }

  histogramValue(i: number): string {
    if (i >= 1000) {
      return `${Math.round(i / 100) / 10}k`;
    }
    return `${i}`;
  }

  getAccuracyColor(accuracy: number): string {
    return EVALUATION_TO_COLOR[overallAccuracyRating(accuracy)];
  }



}
