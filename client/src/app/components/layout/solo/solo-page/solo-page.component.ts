import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, OnDestroy } from '@angular/core';
import { TabID } from 'client/src/app/models/tabs';
import { ColorType, TetrisBoard } from 'client/src/app/models/tetris/tetris-board';
import { TetrominoType } from 'client/src/app/models/tetris/tetromino-type';
import { EmulatorService } from 'client/src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'client/src/app/services/platform-interface.service';
import { RoutingService } from 'client/src/app/services/routing.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-solo-page',
  templateUrl: './solo-page.component.html',
  styleUrls: ['./solo-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoloPageComponent implements OnDestroy {

  readonly TetrominoType = TetrominoType;

  private onSoloSubscription!: Subscription;
  private onMultiplayerSubscription!: Subscription;
  private onLeaveSoloSubscription!: Subscription;
  private onLeaveMultiplayerSubscription!: Subscription;

  constructor(
    private routingService: RoutingService,
    private emulatorService: EmulatorService,
    public platform: PlatformInterfaceService,
  ) {

    // TEMPORARY, NEED MORE FLEXIBLE SYSTEM TO START GAME
    // start game when switch to solo tab
    this.onSoloSubscription = this.routingService.onSwitchToTab(TabID.SOLO).subscribe(() => {
      this.emulatorService.startGame(18);
    });

    this.onMultiplayerSubscription = this.routingService.onSwitchToTab(TabID.MULTIPLAYER).subscribe(() => {
      this.emulatorService.startGame(18, true);
    });

    this.onLeaveSoloSubscription = this.routingService.onLeaveTab(TabID.SOLO).subscribe(() => {
      this.emulatorService.stopGame();
    });

    this.onLeaveMultiplayerSubscription = this.routingService.onLeaveTab(TabID.MULTIPLAYER).subscribe(() => {
      this.emulatorService.stopGame();
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    this.emulatorService.handleKeydown(event);
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyup(event: KeyboardEvent) {
    this.emulatorService.handleKeyup(event);
  }

  exitFullscreen() {
    // go back to previous tab. if no previous tab, go to home
    const lastTab = this.routingService.getLastTab() ?? TabID.HOME;
    console.log("exitFullscreen", lastTab);
    this.routingService.setSelectedTab({tab: lastTab, params: undefined});
  }

  ngOnDestroy(): void {
    this.onSoloSubscription.unsubscribe();
    this.onMultiplayerSubscription.unsubscribe();
    this.onLeaveSoloSubscription.unsubscribe();
    this.onLeaveMultiplayerSubscription.unsubscribe();
  }

}
