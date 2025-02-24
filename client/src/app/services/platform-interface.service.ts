import { ChangeDetectorRef, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { BinaryEncoder } from '../shared/network/binary-codec';
import { PacketAssembler } from '../shared/network/stream-packets/packet-assembler';
import { WebsocketService } from './websocket.service';
import { NotificationService } from './notification.service';
import { NotificationType } from '../shared/models/notifications';
import { DEFAULT_POLLED_GAME_DATA, GameDisplayData, GameDisplayDataWithoutBoard } from '../shared/tetris/game-display-data';
import { PacketSender } from '../ocr/util/packet-sender';
import { sleep } from '../util/misc';
import { TetrisBoard } from '../shared/tetris/tetris-board';


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


UPDATE: This is really bad rxjs practice. A more declarative approach is better.
*/

@Injectable({
  providedIn: 'root'
})
export class PlatformInterfaceService extends PacketSender {

  private platform$ = new BehaviorSubject<Platform>(Platform.ONLINE);
  private polledGameDataWithoutBoard$ = new BehaviorSubject<GameDisplayDataWithoutBoard>(DEFAULT_POLLED_GAME_DATA);
  private polledGameData$ = new BehaviorSubject<GameDisplayData>(DEFAULT_POLLED_GAME_DATA);
  private polledGameBoard$ = new BehaviorSubject<TetrisBoard>(new TetrisBoard());

  private overallAccuracy$ = new BehaviorSubject<number | null>(null);

  private assembler = new PacketAssembler();
  private numBatchedPackets: number = 0;

  public readonly BATCH_PERIOD = 250; // send all accumulated data to the server every BATCH_PERIOD ms

  constructor(
    private websocket: WebsocketService,
    private notificationService: NotificationService,
  ) {
    super();

    // every second, send all accumulated data to the server
    // batching packets reduces the number of websocket messages sent
    setInterval(() => {
      this.sendBatchedPackets();
    }, this.BATCH_PERIOD);

  }

  getGameData$(): Observable<GameDisplayData> {
    return this.polledGameData$.asObservable();
  }

  getGameBoard$(): Observable<TetrisBoard> {
    return this.polledGameBoard$.asObservable();
  }

  getGameDataWithoutBoard$(): Observable<GameDisplayDataWithoutBoard> {
    return this.polledGameDataWithoutBoard$.asObservable();
  }


  onPlatformChange(): Observable<Platform> {
    return this.platform$.asObservable();
  }

  setPlatform(platform: Platform) {

    if (this.platform$.getValue() === platform) return;

    if (platform === Platform.OCR && !(this.websocket.isSignedIn())) {
      this.notificationService.notify(NotificationType.ERROR, "You must be signed in to use the OCR platform.");
      return;
    }

    console.log(`Switching to platform: ${platform}`);

    this.platform$.next(platform);
  }

  getPlatform(): Platform {
    return this.platform$.getValue();
  }

  getPlatform$(): Observable<Platform> {
    return this.platform$.asObservable();
  }

  getOverallAccuracy(): Observable<number | null> {
    return this.overallAccuracy$.asObservable();
  }


  // called by emulator/game-state service to update the game data
  updateGameData(data: GameDisplayData) {
    
    // Check if data is the same as the previous data. If so, don't emit the event
    const prevData = this.polledGameData$.getValue();

    const boardChanged = !prevData.board.equals(data.board);
    const nonBoardChanged = !(
      prevData.countdown === data.countdown &&
      prevData.level === data.level &&
      prevData.lines === data.lines &&
      prevData.score === data.score &&
      prevData.nextPiece === data.nextPiece &&
      prevData.trt === data.trt &&
      prevData.drought === data.drought
    );

    if (boardChanged) this.polledGameBoard$.next(data.board);
    if (nonBoardChanged) this.polledGameDataWithoutBoard$.next(data);
    if (boardChanged || nonBoardChanged) this.polledGameData$.next(data);
  }

  setOverallAccuracy(accuracy: number | null) {
    this.overallAccuracy$.next(accuracy);
  }

  // called by emulator/game-state service to send a packet encoded as a BinaryEncoder
  // by default, is not sent immediately, but is batched and sent by sendBatchedPackets() every second
  sendPacket(packet: BinaryEncoder) {

    this.assembler.addPacketContent(packet);
    this.numBatchedPackets++;
  }

  // called every second internally to send all accumulated data to the server
  sendBatchedPackets() {

    // if there are no packets to send, don't do anything
    if (!this.assembler.hasPackets()) {
      return;
    }

    // encode the packets into Uint8Array, and send it to the server
    const binaryData = this.assembler.encode();
    //console.log(`Sending ${this.numBatchedPackets} batched packets`);
    this.websocket.sendBinaryMessage(binaryData);

    // clear the assembler for the next batch of packets
    this.assembler = new PacketAssembler();
    this.numBatchedPackets = 0;

  }

}
