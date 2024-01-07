import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { TabID } from 'client/src/app/models/tabs';
import { ColorType, TetrisBoard } from 'client/src/app/models/tetris/tetris-board';
import { TetrominoType } from 'client/src/app/models/tetris/tetromino-type';
import { EmulatorService } from 'client/src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'client/src/app/services/platform-interface.service';
import { RoutingService } from 'client/src/app/services/routing.service';

@Component({
  selector: 'app-solo-page',
  templateUrl: './solo-page.component.html',
  styleUrls: ['./solo-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoloPageComponent {

  readonly TetrominoType = TetrominoType;

  constructor(
    private routingService: RoutingService,
    private emulatorService: EmulatorService,
    public platform: PlatformInterfaceService,
  ) {

    // TEMPORARY, NEED MORE FLEXIBLE SYSTEM TO START GAME
    // start game when switch to solo tab
    this.routingService.onSwitchToTab(TabID.SOLO).subscribe(() => {
      this.emulatorService.startGame(18);
    });

    this.routingService.onLeaveTab(TabID.SOLO).subscribe(() => {
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

}
