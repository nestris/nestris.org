import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TableRow } from 'src/app/components/ui/table/table.component';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { EVALUATION_TO_COLOR, EvaluationRating } from 'src/app/shared/evaluation/evaluation';
import { OnlineUserStatus } from 'src/app/shared/models/friends';
import { PuzzleLeaderboard, PuzzleLeaderboardRow } from 'src/app/shared/models/leaderboard';


@Component({
  selector: 'app-main-leaderboard-page',
  templateUrl: './main-leaderboard-page.component.html',
  styleUrls: ['./main-leaderboard-page.component.scss']
})
export class MainLeaderboardPageComponent implements OnInit, OnDestroy {

  numPlayers$ = new BehaviorSubject<number>(0);
  puzzlesSolved$ = new BehaviorSubject<number>(0);
  hoursSpent$ = new BehaviorSubject<number>(0);
  puzzleRows$ = new BehaviorSubject<PuzzleLeaderboardRow[]>([]);

  onlineUserIDs$ = new BehaviorSubject<Map<string, OnlineUserStatus>>(new Map());

  TABLE_ATTRIBUTES: { [key: string]: string } = {
    rating: 'Rating',
    best: 'Best',
    puzzlesSolved: 'Puzzles solved',
    avgSolveTime: 'Average duration',
    solveRate: 'Solve rate',
  };

  FORMAT_RULES: { [key: string]: (value: any) => string } = {
    avgSolveTime: (value: number) => `${value.toFixed(1)}s`,
    solveRate: (value: number) => `${value}%`,
  };

  COLOR_RULES: { [key: string]: (value: number) => string } = {

  };

  timer: any;

  constructor(
    private fetchService: FetchService,
    public websocket: WebsocketService,
  ) {}

  async ngOnInit() {
    await this.sync();
    this.timer = setInterval(() => this.sync(), 5000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  // Regularly poll the server for the number of players and puzzles solved
  private async sync() {
    
    this.numPlayers$.next(await this.pollNumPlayers());
    this.puzzlesSolved$.next(await this.pollPuzzlesSolved());

    const hoursSpent = Math.round((await this.pollTotalPuzzleDuration()) / 3600);
    this.hoursSpent$.next(Math.round(hoursSpent));

    this.puzzleRows$.next(await this.fetchLeaderboard());
    this.onlineUserIDs$.next(await this.fetchOnlineUsers());
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

  private async fetchLeaderboard(): Promise<PuzzleLeaderboardRow[]> {
    const leaderboard = await this.fetchService.fetch<PuzzleLeaderboard>(Method.GET, '/api/v2/puzzle-leaderboard');
    return leaderboard.rows;
  }

  private async fetchOnlineUsers(): Promise<Map<string, OnlineUserStatus>> {
    const response = await this.fetchService.fetch<{userid: string, status: OnlineUserStatus}[]>(
      Method.GET, '/api/v2/online-users'
    );
    
    const onlineUserIDs = new Map<string, OnlineUserStatus>();
    response.forEach(user => onlineUserIDs.set(user.userid, user.status));
    return onlineUserIDs;
  }

  private solveRateToRating(solveRate: number): EvaluationRating {
    if (solveRate >= 70) return EvaluationRating.BEST;
    else if (solveRate >= 60) return EvaluationRating.GOOD;
    else if (solveRate >= 50) return EvaluationRating.MEDIOCRE;
    else if (solveRate >= 40) return EvaluationRating.INACCURACY;
    else if (solveRate >= 30) return EvaluationRating.MISTAKE;
    else return EvaluationRating.BLUNDER;
  }
}
