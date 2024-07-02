import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { TabID } from 'client/src/app/models/tabs';
import { ColorType, TetrisBoard } from 'network-protocol/tetris/tetris-board';
import { TetrominoType } from 'network-protocol/tetris/tetromino-type';
import { EmulatorService } from 'client/src/app/services/emulator/emulator.service';
import { PlatformInterfaceService } from 'client/src/app/services/platform-interface.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { StartSoloRoomMessage, StartSpectateRoomMessage } from 'network-protocol/json-message';
import { Method, fetchServer2 } from 'client/src/app/scripts/fetch-server';
import { ActivatedRoute, Router } from '@angular/router';
import { Role, RoomInfo, RoomMode, isPlayer } from 'network-protocol/models/room-info';
import { ClientRoomState } from './room-state';

export interface RoomClient {
  room: RoomInfo;
  role: Role;
}


@Component({
  selector: 'app-room-page',
  templateUrl: './room-page.component.html',
  styleUrls: ['./room-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomPageComponent implements OnInit, OnDestroy {

  readonly TetrominoType = TetrominoType;
  readonly RoomMode = RoomMode;
  readonly Role = Role;

  client$ = new BehaviorSubject<RoomClient | null>(null);
  roomState?: ClientRoomState;
  
  private packetSubscription?: Subscription;

  constructor(
    private emulatorService: EmulatorService,
    public platform: PlatformInterfaceService,
    private websocket: WebsocketService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {

  }

  async ngOnInit() {

    // get room info from roomID
    this.route.queryParams.subscribe(async params => {
      const roomID = params['id'];
      if (!roomID) {
        console.error('No room ID provided');
        this.redirectHome();
        return;
      }

      const roomInfo = await fetchServer2<RoomInfo | {error: string}>(Method.GET, `/api/v2/room/${roomID}`);
      if ('error' in roomInfo) {
        console.error(roomID, roomInfo.error);
        this.redirectHome();
        return;
      }

      console.log('room info', roomInfo);
      this.client$.next({
        room: roomInfo,
        role: this.getRole(roomInfo)
      });

      
      if (isPlayer(this.client$.getValue()!.role)) {
        // if client is a player in the room, start polling from ocr/emulator
        this.platform.startPolling();
      } else {
        // user is a spectator. request to be added to the websocket room
        this.websocket.sendJsonMessage(new StartSpectateRoomMessage(roomID));

        // start listening for game data
        const numPlayers = this.client$.getValue()!.room.players.length;
        this.roomState = new ClientRoomState(numPlayers);
        this.packetSubscription = this.websocket.onPacketGroup().subscribe(packetGroup => {

          // process each packet sent to the player
          packetGroup.packets.forEach((packet) => this.roomState!.onPacket(packetGroup.playerIndex, packet));

          // update angular change detector
          // TODO: process deltas
          this.cdr.detectChanges();
        
        });
      }

    });
  }

  redirectHome() {
    this.router.navigate(['/']);
  }

  private getRole(room: RoomInfo): Role {
    const sessionID = this.websocket.getSessionID();
    if (room.players[0]?.sessionID === sessionID) return Role.PLAYER_1;
    if (room.players[1]?.sessionID === sessionID) return Role.PLAYER_2;
    return Role.SPECTATOR;
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

  ngOnDestroy(): void {
    this.platform.stopPolling();
    this.packetSubscription?.unsubscribe();
  }

}
