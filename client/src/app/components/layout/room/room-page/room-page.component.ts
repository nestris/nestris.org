import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { Platform, PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { Role, RoomInfo, RoomMode, isPlayer } from 'src/app/shared/models/room-info';
import { RequestRecoveryPacketMessage, StartSpectateRoomMessage, StartSoloRoomMessage } from 'src/app/shared/network/json-message';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';
import { ClientRoomState } from './room-state';
import { NotificationService } from 'src/app/services/notification.service';
import { NotificationType } from 'src/app/shared/models/notifications';

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
  readonly Platform = Platform;
  readonly BUFFER_DELAY;

  client$ = new BehaviorSubject<RoomClient | null>(null);
  roomState?: ClientRoomState;
  
  private packetSubscription?: Subscription;

  constructor(
    public emulator: EmulatorService,
    public platform: PlatformInterfaceService,
    private websocket: WebsocketService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {

    // add 200ms to the batch period to account for network latency
    this.BUFFER_DELAY = platform.BATCH_PERIOD + 200; 

  }

  async ngOnInit() {

    console.log("session:", this.websocket.getSessionID());

    // If not logged in, only thing user can do is play a solo game on the emulator
    if (!this.websocket.isSignedIn()) {
      this.notificationService.notify(NotificationType.WARNING, "You are not logged in. Progress will not be saved!");

      this.client$.next({
        room: {
          roomID: '',
          mode: RoomMode.SOLO,
          players: [{
            userid: '',
            username: 'Guest',
            sessionID: '',
            role: Role.PLAYER_1
          }]
        },
        role: Role.PLAYER_1
      });

      this.platform.setPlatform(Platform.ONLINE);
      this.platform.startPolling();
      return;
    }

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

      // Initialize the data structures for storing the game state of each player
      this.roomState = new ClientRoomState(this.cdr, roomInfo.players.length, this.BUFFER_DELAY);

      console.log('room info', roomInfo);
      this.client$.next({
        room: roomInfo,
        role: this.getRole(roomInfo)
      });
      console.log('my role:', this.client$.getValue()!.role);

      // start listening for packets from the server
      this.packetSubscription = this.websocket.onPacketGroup().subscribe(packetGroup => {
        
        // for each packet received, queue into the room state's PacketReplayer
        packetGroup.packets.forEach((packet) => {
          this.roomState!.onReceivePacket(packetGroup.playerIndex, packet)
        });
      });

      
      if (isPlayer(this.client$.getValue()!.role)) {
        // if client is a player in the room, start polling from ocr/emulator
        this.platform.startPolling();

        // request recovery packets from other players through the server
        console.log('Is player, requesting recovery packets');
        this.websocket.sendJsonMessage(new RequestRecoveryPacketMessage());
      } else {
        // user is a spectator. request to be added to the websocket room
        console.log('Is spectator, requesting to spectate room');
        this.websocket.sendJsonMessage(new StartSpectateRoomMessage(roomID));
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
    this.emulator.handleKeydown(event);
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyup(event: KeyboardEvent) {
    this.emulator.handleKeyup(event);
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
