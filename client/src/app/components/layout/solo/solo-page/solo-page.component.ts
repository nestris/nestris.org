import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { TabID } from 'client/src/app/models/tabs';
import { ColorType, TetrisBoard } from 'client/src/app/models/tetris/tetris-board';
import { TetrominoType } from 'client/src/app/models/tetris/tetromino-type';
import { EmulatorService } from 'client/src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'client/src/app/services/platform-interface.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-solo-page',
  templateUrl: './solo-page.component.html',
  styleUrls: ['./solo-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoloPageComponent implements OnInit, OnDestroy {

  readonly TetrominoType = TetrominoType;

  constructor(
    private emulatorService: EmulatorService,
    public platform: PlatformInterfaceService,
  ) {

  }

  ngOnInit() {
    this.emulatorService.startGame(18);
    this.platform.startPolling();
  }

  ngOnDestroy(): void {
      this.emulatorService.stopGame();
      this.platform.stopPolling();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    this.emulatorService.handleKeydown(event);
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyup(event: KeyboardEvent) {
    this.emulatorService.handleKeyup(event);
  }

}
