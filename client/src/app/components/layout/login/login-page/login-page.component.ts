import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { GameOverMode } from 'src/app/components/nes-layout/nes-board/nes-board.component';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { WebsocketService } from 'src/app/services/websocket.service';

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


  readonly LEADERBOARD_COLORS = ["#FFB938", "#C9C9C9", "#E59650"];

  readonly INFO_TEXT = [
    "Play ranked matches to climb the trophy ladder",
    "Train your stacking with tough puzzles",
    "Challenge friends or similarly-rated opponents",
    "Analyze full games with the StackRabbit engine",
    "Plug in your NES console to play others online!"
  ]

  constructor(
    public websocketService: WebsocketService,
    public emulator: EmulatorService,
    public platform: PlatformInterfaceService,
  ) {}

  ngOnInit(): void {
    this.windowWidth = window.innerWidth;
    this.calculateSmall();


    // Start the emulator for login page
    this.emulator.startGame(5, false);

    // Listen for game over
    this.emulator.onTopout().subscribe(() => {
      console.log("Game over");
      this.inGame$.next(false);
    });

  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.windowWidth = event.target.innerWidth;
    this.calculateSmall();
  }

  private calculateSmall() {
    this.small$.next(this.windowWidth <= 800);
    this.reallySmall$.next(this.windowWidth <= 500);
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
