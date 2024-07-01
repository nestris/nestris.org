import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { TabID } from 'client/src/app/models/tabs';
import { ColorType, TetrisBoard } from 'network-protocol/tetris/tetris-board';
import { TetrominoType } from 'network-protocol/tetris/tetromino-type';
import { EmulatorService } from 'client/src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'client/src/app/services/platform-interface.service';
import { Subscription } from 'rxjs';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { StartSoloRoomMessage } from 'network-protocol/json-message';

@Component({
  selector: 'app-room-page',
  templateUrl: './room-page.component.html',
  styleUrls: ['./room-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomPageComponent implements OnInit, OnDestroy {

  readonly TetrominoType = TetrominoType;

  constructor(
    private emulatorService: EmulatorService,
    public platform: PlatformInterfaceService,
    private websocket: WebsocketService
  ) {

  }

  async ngOnInit() {


    // fetch room

    this.platform.startPolling();
  }

  ngOnDestroy(): void {
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

  async onExit() {


    // first, send any remaining game data to the server
    this.platform.sendBatchedPackets();

    // send a message to the server to leave the room
    this.websocket.sendJsonMessage(new StartSoloRoomMessage("", false));
  }

}
