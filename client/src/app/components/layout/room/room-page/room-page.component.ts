import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { EmulatorService } from 'src/app/services/emulator/emulator.service';
import { Platform, PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { Role, RoomInfo, RoomMode, isPlayer } from 'src/app/shared/models/room-info';
import { StartSpectateRoomMessage, StartSoloRoomMessage, JsonMessageType, MultiplayerRoomUpdateMessage, SoloGameEndMessage } from 'src/app/shared/network/json-message';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';
import { ClientRoomState } from './room-state';
import { NotificationService } from 'src/app/services/notification.service';
import { NotificationType } from 'src/app/shared/models/notifications';
import { getMatchScore, MultiplayerData, MultiplayerPlayerMode, MultiplayerRoomMode, PlayerRole } from 'src/app/shared/models/multiplayer';
import { GameOverMode } from 'src/app/components/nes-layout/nes-board/nes-board.component';
import { OcrGameService } from 'src/app/services/ocr/ocr-game.service';


export interface RoomClient {
  room: RoomInfo;
  role: Role;
}

export enum RoomModalType {
  SOLO_BEFORE_FIRST_GAME = 'SOLO_BEFORE_FIRST_GAME',
  SOLO_AFTER_GAME = 'SOLO_AFTER_GAME',
  MULTIPLAYER_IN_MATCH = 'MULTIPLAYER_IN_MATCH',
  MULTIPLAYER_AFTER_MATCH = 'MULTIPLAYER_AFTER_MATCH',
}

export enum SoloMode {
  BEFORE_GAME = 'BEFORE_GAME', // on solo room init, start here
  IN_GAME = 'IN_GAME', // When "Play" in modal clicked, transition here and start emulator/ocr
  TOPOUT = 'TOPOUT', // When server tells client that game ends, transition here
  AFTER_GAME = 'AFTER_GAME', // When play clicks "Next" after topout, transition here and show modal
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
  readonly RoomModalType = RoomModalType;
  readonly SoloMode = SoloMode;

  readonly BUFFER_DELAY = 300;

  client$ = new BehaviorSubject<RoomClient | null>(null);
  roomState?: ClientRoomState;

  soloMode$ = new BehaviorSubject<SoloMode | null>(null);
  soloGameEndMessage$ = new BehaviorSubject<SoloGameEndMessage | null>(null);
  
  private packetSubscription?: Subscription;

  public multiplayerData$ = new BehaviorSubject<MultiplayerData | null>(null);
  private multiplayerSubscription?: Subscription;
  private soloSubscription?: Subscription;

  screenWidth$ = new BehaviorSubject<number>(window.innerWidth);

  constructor(
    public emulator: EmulatorService,
    public ocrGame: OcrGameService,
    public platform: PlatformInterfaceService,
    private websocket: WebsocketService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
  ) {

    this.multiplayerData$.subscribe((data) => {
      if (data) {
        console.log('new multiplayer data:', data);
      }
    });

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
      this.emulator.startGame(9);
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
        
        switch (roomInfo.mode) {
          case RoomMode.SOLO: await this.initSoloRoom(); break;
          case RoomMode.MULTIPLAYER: await this.initMultiplayerRoom(true); break;
          default: console.error('Invalid room mode', roomInfo.mode);
        }
      } else {
        // user is a spectator. request to be added to the websocket room
        console.log('Is spectator, requesting to spectate room');
        this.websocket.sendJsonMessage(new StartSpectateRoomMessage(roomID));

        // Also subscribe to multiplayer room updates as a spectator
        if (roomInfo.mode === RoomMode.MULTIPLAYER) {
          await this.initMultiplayerRoom(false);
        }
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

  private async initSoloRoom() {
    console.log('init solo room');
    this.soloMode$.next(SoloMode.BEFORE_GAME);

    // If recieve end solo game from server, transition to AFTER_GAME
    this.soloSubscription = this.websocket.onEvent(JsonMessageType.SOLO_GAME_END).subscribe((message) => {
      this.soloGameEndMessage$.next(message as SoloGameEndMessage);
      this.soloMode$.next(SoloMode.TOPOUT);
    });

  }

  private async initMultiplayerRoom(isPlayer: boolean) {
    console.log('init multiplayer room');
    // Listen to all multiplayer room data updates, and get initial data
    this.multiplayerSubscription = this.websocket.onEvent(JsonMessageType.MULTIPLAYER_ROOM_UPDATE).subscribe(message => {
      const old = this.multiplayerData$.getValue();
      this.multiplayerData$.next((message as MultiplayerRoomUpdateMessage).data);

      // Players also can bind to changes to update player UI
      if (isPlayer) this.onMultiplayerDataChange(old, this.multiplayerData$.getValue());
    });
    this.multiplayerData$.next(await fetchServer2<MultiplayerData>(Method.GET, `/api/v2/multiplayer-data/${this.client$.getValue()!.room.roomID}`));
  }

  clickPlaySolo(level: number) {
    if (this.soloMode$.getValue() === SoloMode.BEFORE_GAME) {
      this.soloMode$.next(SoloMode.IN_GAME);
      this.startGame(level, RoomMode.SOLO);
    } else {
      console.error(`Must be in BEFORE_GAME mode to transition to IN_GAME mode, but in ${this.soloMode$.getValue()}`);
    }
  }

  // When user clicks "Next" in the After Game modal in solo to go to the Before Game modal
  clickSoloAfterToBefore() {
    if (this.soloMode$.getValue() === SoloMode.AFTER_GAME) {
      // delay by 200ms for better UX. Otherwise, there's a chance of double clicking through both modals
      setTimeout(() => {
        this.soloMode$.next(SoloMode.BEFORE_GAME);
      }, 50);
    } else {
      console.error(`Must be in AFTER_GAME mode to transition to BEFORE_GAME mode, but in ${this.soloMode$.getValue()}`);
    }
  }

  // Start the game, either by starting the emulator or starting OCR
  private startGame(level: number, mode: RoomMode) {
    if (this.platform.getPlatform() === Platform.ONLINE) {
      // If online, start emulator game at startLevel
      this.emulator.startGame(level);
    } else {
      // If OCR, start polling for game data. In solo mode, can start on any level. But on
      // multiplayer mode, needs to match the agreed-upon level
      this.ocrGame.startGame(mode === RoomMode.MULTIPLAYER ? level : null);
    }
  }

  multiplayerModalToShow(data: MultiplayerData | null): RoomModalType | null {

    if (!data) return null;

    const myRole = this.client$.getValue()!.role;

    // Spectators don't see modals
    if (!isPlayer(myRole)) return null;

    const myMode = data.state.players[myRole as PlayerRole].mode;
    const roomMode = data.state.mode;

    // When player is playing, or dead but hasn't pressed "next" to get to modal yet, don't show modal
    if ([MultiplayerPlayerMode.IN_GAME, MultiplayerPlayerMode.DEAD].includes(myMode)) {
      return null;
    }

    if ([MultiplayerRoomMode.WAITING, MultiplayerRoomMode.COUNTDOWN].includes(roomMode)) {
      return RoomModalType.MULTIPLAYER_IN_MATCH;
    } else if (roomMode === MultiplayerRoomMode.MATCH_ENDED) {
      return RoomModalType.MULTIPLAYER_AFTER_MATCH;
    }
    return null;
  }

  private onMultiplayerDataChange(old: MultiplayerData | null, now: MultiplayerData | null) {
    if (!old || !now) return;

    // Transition from COUNTDOWN -> PLAYING should trigger game start
    if (old.state.mode === MultiplayerRoomMode.COUNTDOWN && now.state.mode === MultiplayerRoomMode.PLAYING) {
      console.log('countdown ended, starting multiplayer game');
      this.startGame(now.state.startLevel, RoomMode.MULTIPLAYER);
    }
  }

  rightBoardRole(role: Role): PlayerRole {
    // if spectator, right side is always player 2's board
    if (role === Role.SPECTATOR) return Role.PLAYER_2;

    // If player, right side is the other player's board
    return role === Role.PLAYER_1 ? Role.PLAYER_2 : Role.PLAYER_1;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    this.emulator.handleKeydown(event);
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyup(event: KeyboardEvent) {
    this.emulator.handleKeyup(event);
  }

  // We want to keep track of screen width to dynamically scale games
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.screenWidth$.next(window.innerWidth);
  }

  // Get how much to CSS scale each game board, depending on the screen width and solo/multiplayer mode
  getScale(client: RoomClient, screenWidth: number | null): number {
    if (!screenWidth) screenWidth = this.screenWidth$.getValue();

    // If multiplayer, scale proportionally so it fills around half the screen width
    if (client.room.mode === RoomMode.MULTIPLAYER) return screenWidth / 1370;

    // If solo, scale proportionally so it fills most of the screen width
    else return screenWidth / 1250;
  };

  getGameOverMode(data: MultiplayerData | null, role: PlayerRole, soloMode?: SoloMode | null): GameOverMode | undefined {

    // If solo mode, just show topout screen
    if (soloMode === SoloMode.TOPOUT) return GameOverMode.TOPOUT;

    if (!data) return undefined;
    if (data.match.points.length === 0) return undefined;

    // If in multiplayer mode and game over, determine if win/lose/tie and show that
    if ([MultiplayerRoomMode.WAITING, MultiplayerRoomMode.MATCH_ENDED].includes(data.state.mode)) {
      const endedGame = data.match.points[data.match.points.length - 1];
      const myScore = role === Role.PLAYER_1 ? endedGame.scorePlayer1 : endedGame.scorePlayer2;
      const theirScore = role === Role.PLAYER_1 ? endedGame.scorePlayer2 : endedGame.scorePlayer1;

      if (myScore > theirScore) return GameOverMode.WIN;
      if (myScore < theirScore) return GameOverMode.LOSE;
      return GameOverMode.TIE;
    }
    return undefined;
  }

  /**
   * Called when this player tops out
   */
  async onClickNextAfterGameOver() {
    console.log('click next');
    if (this.client$.getValue()!.room.mode === RoomMode.SOLO) {
      // In solo mode, transition from topout to after game
      this.soloMode$.next(SoloMode.AFTER_GAME);
    } else {
      // In multiplayer mode, transition from dead to waiting in the server
      const sessionID = this.websocket.getSessionID();
      await fetchServer2(Method.POST, `/api/v2/multiplayer/transition-dead-to-waiting/${sessionID}`);
    }
    
  }

  async onExit() {


    // first, send any remaining game data to the server
    this.platform.sendBatchedPackets();

    // send a message to the server to leave the room
    this.websocket.sendJsonMessage(new StartSoloRoomMessage("", false));
  }

  async ngOnDestroy() {
    this.emulator.stopGame();
    this.ocrGame.stopGame();
    this.packetSubscription?.unsubscribe();
    this.multiplayerSubscription?.unsubscribe();
    this.soloSubscription?.unsubscribe();

    // Tell server to leave the room
    console.log('leaving room');
    await fetchServer2(Method.POST, `/api/v2/leave-room/${this.websocket.getSessionID()}`);
  }

}
