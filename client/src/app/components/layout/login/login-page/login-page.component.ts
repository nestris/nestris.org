import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { GameOverMode } from 'src/app/components/nes-layout/nes-board/nes-board.component';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { GlobalStat, GlobalStats } from 'src/app/shared/models/global-stat';
import { T200LeaderboardData, T200LeaderboardRow, T200LeaderboardType } from 'src/app/shared/models/leaderboard';

interface LoginPageStats {
  leaderboard: T200LeaderboardRow[],
  gameCount: number,
  onlineUserCount: number,
};

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit, OnDestroy {

  public windowWidth!: number;

  public inGame$ = new BehaviorSubject<boolean>(true);
  public small$ = new BehaviorSubject<boolean>(false);
  public reallySmall$ = new BehaviorSubject<boolean>(false);
  public big$ = new BehaviorSubject<boolean>(false);

  public stats$ = new BehaviorSubject<LoginPageStats | undefined>(undefined);

  readonly LEADERBOARD_COLORS = ["#FFB938", "#C9C9C9", "#E59650"];

  readonly INFO_TEXT = [
    "Play ranked matches to climb the trophy ladder",
    "Train your stacking with tough puzzles",
    "Challenge friends or similarly-rated opponents",
    "Analyze full games with the StackRabbit engine",
    "Plug in your NES console to play others online!"
  ]

  constructor(
    public readonly websocketService: WebsocketService,
    public readonly emulator: EmulatorService,
    public readonly platform: PlatformInterfaceService,
    private readonly modalManager: ModalManagerService,
    private readonly fetchService: FetchService,
  ) {}

  async ngOnInit() {

    

    this.modalManager.hideModal();

    this.windowWidth = window.innerWidth;
    this.calculateSmall();

    this.stats$.next(await this.getLoginPageStats())

    // Start the emulator for login page
    this.emulator.startGame(5, false);

    // Listen for game over
    this.emulator.onTopout().subscribe(() => {
      console.log("Game over");
      this.inGame$.next(false);
    });

  }

  private async getLoginPageStats(): Promise<LoginPageStats> {
    const dataPromise = this.fetchService.fetch<T200LeaderboardData>(Method.GET, `/api/v2/leaderboard/top/${T200LeaderboardType.RANKED}`)
    const statsPromise = this.fetchService.fetch<GlobalStats>(Method.GET, "/api/v2/global-stats");
    const onlineUsersPromise = this.fetchService.fetch<any[]>(Method.GET, "api/v2/online-users");
    const [ data, stats, onlineUsers ] = await Promise.all([dataPromise, statsPromise, onlineUsersPromise]);
    
    return {
      leaderboard: data.leaderboard.slice(0, 3), // Get first 3 rows of leaderboard
      gameCount: stats[GlobalStat.TOTAL_GAMES_PLAYED],
      onlineUserCount: onlineUsers.length,
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.windowWidth = event.target.innerWidth;
    this.calculateSmall();
  }

  passwordLogin() {
    this.modalManager.showModal(ModalType.AUTH);
  }

  private calculateSmall() {
    this.small$.next(this.windowWidth <= 800);
    this.reallySmall$.next(this.windowWidth <= 500);
    this.big$.next(this.windowWidth > 1200);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    this.emulator.handleKeydown(event);
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyup(event: KeyboardEvent) {
    this.emulator.handleKeyup(event);
  }

  ngOnDestroy(): void {
    // Stop any ongoing game
    this.emulator.stopGame();
  }

  scoreToSixDigits(score: number): string {
    return score.toString().padStart(6, '0');
  }

}
