import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BinaryEncoder } from '../shared/network/binary-codec';
import { PacketAssembler } from '../shared/network/stream-packets/packet-assembler';
import { TetrisBoard } from '../shared/tetris/tetris-board';
import { TetrominoType } from '../shared/tetris/tetromino-type';
import { WebsocketService } from './websocket.service';
import { NotificationService } from './notification.service';
import { NotificationType } from '../shared/models/notifications';


export enum Platform {
  ONLINE = "ONLINE",
  OCR = "OCR"
}

/*
The purpose of this service is to poll game data from the online platform or the OCR platform
at a regular interval, and send the polled data both to the display layout component and to the
websocket service to send to the server. Because this is decoupled from the actual ocr/emulator
game loop, we gain frame rate independence.

Game data changes are emitted as an observable, which the display layout component can subscribe to.

It is not the responsibility of this class to do things like start or stop emulator games. it simply
polls from emulator class at specified interval.
*/


export class PolledGameData {
  constructor(
    public readonly board: TetrisBoard,
    public readonly nextPiece: TetrominoType,
    public readonly level: number,
    public readonly lines: number,
    public readonly score: number,
    public readonly countdown: number | undefined,
  ) {}
}

const DEFAULT_POLLED_GAME_DATA = new PolledGameData(
  new TetrisBoard(),
  TetrominoType.ERROR_TYPE,
  18,
  0,
  0,
  undefined
);


/*
Routinely polls from either the online platform or the OCR platform, depending on which platform is selected.
*/

@Injectable({
  providedIn: 'root'
})
export class PlatformInterfaceService {

  private platform$ = new BehaviorSubject<Platform>(Platform.ONLINE);
  private polledGameData$ = new BehaviorSubject<PolledGameData>(DEFAULT_POLLED_GAME_DATA);


  private assembler = new PacketAssembler();
  private numBatchedPackets: number = 0;

  public readonly BATCH_PERIOD = 250; // send all accumulated data to the server every BATCH_PERIOD ms

  constructor(
    private websocket: WebsocketService,
    private notificationService: NotificationService
  ) {

    // every second, send all accumulated data to the server
    // batching packets reduces the number of websocket messages sent
    setInterval(() => {
      this.sendBatchedPackets();
    }, this.BATCH_PERIOD);

  }

  getGameData(): PolledGameData | undefined {
    return this.polledGameData$.getValue();
  }

  getGameData$(): Observable<PolledGameData> {
    return this.polledGameData$.asObservable();
  }

  getGameEvent$(): Observable<PolledGameData | undefined> {
    return this.polledGameData$.asObservable();
  }


  onPlatformChange(): Observable<Platform> {
    return this.platform$.asObservable();
  }

  setPlatform(platform: Platform) {

    if (platform === Platform.OCR && !(this.websocket.isSignedIn())) {
      this.notificationService.notify(NotificationType.ERROR, "You must be signed in to use the OCR platform.");
      return;
    }

    this.platform$.next(platform);
  }

  getPlatform(): Platform {
    return this.platform$.getValue();
  }

  getPlatform$(): Observable<Platform> {
    return this.platform$.asObservable();
  }


  // called by emulator/game-state service to update the game data
  updateGameData(data: PolledGameData) {
    this.polledGameData$.next(data);
  }

  // called by emulator/game-state service to send a packet encoded as a BinaryEncoder
  // by default, is not sent immediately, but is batched and sent by sendBatchedPackets() every second
  sendPacket(packet: BinaryEncoder, sendImmediately: boolean = false) {
    this.assembler.addPacketContent(packet);
    this.numBatchedPackets++;
    if (sendImmediately) this.sendBatchedPackets();
  }

  // called every second internally to send all accumulated data to the server
  sendBatchedPackets() {

    // if there are no packets to send, don't do anything
    if (!this.assembler.hasPackets()) {
      return;
    }

    // encode the packets into Uint8Array, and send it to the server
    const binaryData = this.assembler.encode();
    console.log(`Sending ${this.numBatchedPackets} batched packets`);
    this.websocket.sendBinaryMessage(binaryData);

    // clear the assembler for the next batch of packets
    this.assembler = new PacketAssembler();
    this.numBatchedPackets = 0;

  }

}
