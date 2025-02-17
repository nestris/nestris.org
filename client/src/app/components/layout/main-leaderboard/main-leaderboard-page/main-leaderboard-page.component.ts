import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, distinctUntilChanged, filter, from, map, of, share, shareReplay, switchMap, timer } from 'rxjs';
import { Mode } from 'src/app/components/ui/mode-icon/mode-icon.component';
import { ButtonColor } from 'src/app/components/ui/solid-selector/solid-selector.component';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { MeService } from 'src/app/services/state/me.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { EVALUATION_TO_COLOR, overallAccuracyRating } from 'src/app/shared/evaluation/evaluation';
import { GlobalStat, GlobalStats } from 'src/app/shared/models/global-stat';
import { T200LeaderboardData, T200LeaderboardType } from 'src/app/shared/models/leaderboard';

interface GlobalStatDisplay {
  icon: string;
  label: string;
  stat: GlobalStat;
}

@Component({
  selector: 'app-main-leaderboard-page',
  templateUrl: './main-leaderboard-page.component.html',
  styleUrls: ['./main-leaderboard-page.component.scss']
})
export class MainLeaderboardPageComponent implements OnDestroy {

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

  readonly globalStatDisplays: { [key in Mode]: GlobalStatDisplay[] } = {
    [Mode.SOLO]: [
      { icon: './assets/img/tab-icons/profile.svg', label: 'Players', stat: GlobalStat.TOTAL_USER_COUNT },
      { icon: './assets/img/puzzle-button-icons/play.svg', label: 'Games played', stat: GlobalStat.TOTAL_GAMES_PLAYED },
      { icon: './assets/img/tab-icons/play.svg', label: 'Pieces placed', stat: GlobalStat.TOTAL_PIECES_PLACED },

    ],
    [Mode.RANKED]: [
      { icon: './assets/img/tab-icons/profile.svg', label: 'Players', stat: GlobalStat.TOTAL_USER_COUNT },
      { icon: './assets/img/button-icons/trophy.svg', label: 'Matches played', stat: GlobalStat.TOTAL_MATCHES_PLAYED },
      { icon: './assets/img/tab-icons/time.svg', label: 'Hours played', stat: GlobalStat.TOTAL_MATCH_HOURS },
    ],
    [Mode.PUZZLES]: [
      { icon: './assets/img/tab-icons/profile.svg', label: 'Players', stat: GlobalStat.TOTAL_USER_COUNT },
      { icon: './assets/img/tab-icons/puzzles.svg', label: 'Puzzles solved', stat: GlobalStat.TOTAL_PUZZLES_SOLVED },
      { icon: './assets/img/tab-icons/time.svg', label: 'Hours played', stat: GlobalStat.TOTAL_PUZZLE_HOURS },

    ],
  };


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

  private readonly fetchLeaderboard = async (type: T200LeaderboardType) => {

    // Fetch leaderboard data and global stats in parallel
    const dataPromise = this.fetchService.fetch<T200LeaderboardData>(Method.GET, `/api/v2/leaderboard/top/${type}`)
    const statsPromise = this.fetchService.fetch<GlobalStats>(Method.GET, "/api/v2/global-stats");
    const [data, stats] = await Promise.all([dataPromise, statsPromise]);

    console.log('Fetched leaderboard:', data, stats);
    
    return { data, stats };
  };
  
  leaderboard$ = this.currentType$.pipe(
    distinctUntilChanged(), // Only react when the type actually changes
    switchMap(type =>
      // On type change, start a timer that fires immediately and then every 5s
      timer(0, 5000).pipe(
        switchMap(() =>
          from(this.fetchLeaderboard(type)).pipe(
            catchError(error => {
              console.error('Failed to fetch leaderboard:', error);
              return of(null);
            })
          )
        )
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true }) // Share the last emitted value with new subscribers
  );

  playerCount$ = this.leaderboard$.pipe(
    map((leaderboard) => leaderboard?.stats[GlobalStat.TOTAL_USER_COUNT] as number ?? 0)
  );


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
}
