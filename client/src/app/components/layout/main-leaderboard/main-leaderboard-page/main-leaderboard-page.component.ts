import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, distinctUntilChanged, from, map, of, switchMap } from 'rxjs';
import { Mode } from 'src/app/components/ui/mode-icon/mode-icon.component';
import { ButtonColor } from 'src/app/components/ui/solid-selector/solid-selector.component';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { MeService } from 'src/app/services/state/me.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { EVALUATION_TO_COLOR, overallAccuracyRating } from 'src/app/shared/evaluation/evaluation';
import { T200LeaderboardData, T200LeaderboardType } from 'src/app/shared/models/leaderboard';


@Component({
  selector: 'app-main-leaderboard-page',
  templateUrl: './main-leaderboard-page.component.html',
  styleUrls: ['./main-leaderboard-page.component.scss']
})
export class MainLeaderboardPageComponent implements OnInit, OnDestroy {

  readonly Mode = Mode;
  readonly modes = [Mode.SOLO, Mode.RANKED, Mode.PUZZLES];

  readonly ButtonColor = ButtonColor;

  readonly leaderboardTypes: { [key in Mode]: T200LeaderboardType[] } = {
    [Mode.SOLO]: [T200LeaderboardType.SOLO_HIGHSCORE, T200LeaderboardType.SOLO_XP],
    [Mode.RANKED]: [T200LeaderboardType.RANKED],
    [Mode.PUZZLES]: [T200LeaderboardType.PUZZLES],
  };

  readonly leaderboardTypeLabels: { [key in T200LeaderboardType]: string } = {
    [T200LeaderboardType.SOLO_XP]: 'League',
    [T200LeaderboardType.SOLO_HIGHSCORE]: 'Highscore',
    [T200LeaderboardType.RANKED]: 'Trophies',
    [T200LeaderboardType.PUZZLES]: 'Puzzle Elo',
  };

  readonly leaderboardTypeIcon: { [key in T200LeaderboardType]: string } = {
    [T200LeaderboardType.SOLO_XP]: './assets/img/tab-icons/play.svg',
    [T200LeaderboardType.SOLO_HIGHSCORE]: './assets/img/tab-icons/play.svg',
    [T200LeaderboardType.RANKED]: './assets/img/tab-icons/play.svg',
    [T200LeaderboardType.PUZZLES]: './assets/img/tab-icons/puzzles.svg',
  }

  readonly getLabelsForMode = (mode: Mode) => this.leaderboardTypes[mode].map(type => this.leaderboardTypeLabels[type]);
  readonly getIconsForMode = (mode: Mode) => this.leaderboardTypes[mode].map(type => this.leaderboardTypeIcon[type]);



  // The current leaderboard type
  currentType$ = new BehaviorSubject<T200LeaderboardType>(T200LeaderboardType.SOLO_HIGHSCORE);

  // The current mode based on the current type
  currentMode$ = this.currentType$.pipe(
    map(type => {
      for (const mode of this.modes) {
        if (this.leaderboardTypes[mode].includes(type)) return mode;
      }
      return Mode.SOLO;
    })
  );

  private readonly fetchLeaderboard = (type: T200LeaderboardType) => this.fetchService.fetch<T200LeaderboardData>(Method.GET, `/api/v2/leaderboard/top/${type}`);

  leaderboard$ = this.currentType$.pipe(
    distinctUntilChanged(), // Avoid unnecessary calls for the same type
    switchMap(type =>
      from(this.fetchLeaderboard(type)).pipe(
        catchError(error => {
          console.error('Failed to fetch leaderboard:', error);
          return of(null); // Fallback to null or an appropriate default value
        })
      )
    )
  );


  numPlayers$ = new BehaviorSubject<number>(0);
  puzzlesSolved$ = new BehaviorSubject<number>(0);
  hoursSpent$ = new BehaviorSubject<number>(0);

  TABLE_ATTRIBUTES: { [key: string]: string } = {
    rating: 'Rating',
    best: 'Best',
    puzzlesSolved: 'Puzzles solved',
    avgSolveTime: 'Average duration',
    solveRate: 'Solve rate',
  };

  FORMAT_RULES: { [key: string]: (value: any) => string } = {
    highscore_accuracy: accuracy => `${(accuracy*100).toFixed(1)}%`,
  };

  COLOR_RULES: { [key: string]: (value: number) => string } = {
    highscore_accuracy: accuracy => EVALUATION_TO_COLOR[overallAccuracyRating(accuracy*100)],
  };

  timer: any;

  constructor(
    private fetchService: FetchService,
    public websocket: WebsocketService,
    public meService: MeService,
  ) {

    // print on currentType$ change
    this.currentType$.subscribe(type => console.log('currentType$', type));

    // print on leaderboard$ change
    this.leaderboard$.subscribe(leaderboard => console.log('leaderboard$', leaderboard));

  }

  async ngOnInit() {
    console.log("MainLeaderboardPageComponent: ngOnInit()");
    //await this.sync();
    //this.timer = setInterval(() => this.sync(), 5000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  setMode(mode: Mode) {
    // If current type's mode is the same, do nothing
    if (this.leaderboardTypes[mode].includes(this.currentType$.getValue())) return;
    
    this.currentType$.next(this.leaderboardTypes[mode][0]);

  }

  setType(mode: Mode, typeIndex: number) {
    this.currentType$.next(this.leaderboardTypes[mode][typeIndex]);
  }

  getIndexForType(mode: Mode, type: T200LeaderboardType | null): number {
    if (type === null) return 0;
    return this.leaderboardTypes[mode].indexOf(type);
  }

  // Regularly poll the server for the number of players and puzzles solved
  private async sync() {
    
    this.numPlayers$.next(await this.pollNumPlayers());
    this.puzzlesSolved$.next(await this.pollPuzzlesSolved());

    const hoursSpent = Math.round((await this.pollTotalPuzzleDuration()) / 3600);
    this.hoursSpent$.next(Math.round(hoursSpent));

    //this.onlineUserIDs$.next(await this.fetchOnlineUsers());
  }

  private async pollNumPlayers(): Promise<number> {
    const response = await this.fetchService.fetch<{count: number}>(Method.GET, '/api/v2/user-count');
    return response.count;
  }

  private async pollPuzzlesSolved(): Promise<number> {
    const response = await this.fetchService.fetch<{count: number}>(Method.GET, '/api/v2/puzzles-solved');
    return response.count;
  }

  private async pollTotalPuzzleDuration(): Promise<number> {
    const response = await this.fetchService.fetch<{total: number}>(Method.GET, '/api/v2/total-puzzle-duration');
    return response.total;
  }
}
