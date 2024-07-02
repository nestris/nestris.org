import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TetrisBoard } from '../../../../network-protocol/tetris/tetris-board';
import { TetrominoType } from '../../../../network-protocol/tetris/tetromino-type';
import { PacketAssembler } from 'network-protocol/stream-packets/packet-assembler';
import { BinaryEncoder } from 'network-protocol/binary-codec';
import { WebsocketService } from './websocket.service';

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
  ) {}
}

const DEFAULT_POLLED_GAME_DATA = new PolledGameData(
  new TetrisBoard(),
  TetrominoType.ERROR_TYPE,
  18,
  0,
  0
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

  private pollingEmulator$ = new BehaviorSubject<boolean>(false);
  private pollingOCR$ = new BehaviorSubject<boolean>(false);

  private assembler = new PacketAssembler();

  constructor(
    private websocket: WebsocketService,
  ) {

    // every second, send all accumulated data to the server
    // batching packets reduces the number of websocket messages sent
    setInterval(() => {
      this.sendBatchedPackets();
    }, 1000);

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
    this.platform$.next(platform);
  }

  getPlatform(): Platform {
    return this.platform$.getValue();
  }

  startPolling() {
    if (this.platform$.getValue() === Platform.ONLINE) {
      this.pollingEmulator$.next(true);
      this.pollingOCR$.next(false);
    } else {
      this.pollingOCR$.next(true);
      this.pollingEmulator$.next(false);
    }
  }

  getPollingEmulator$(): Observable<boolean> {
    return this.pollingEmulator$.asObservable();
  }

  getPollingOCR$(): Observable<boolean> {
    return this.pollingOCR$.asObservable();
  }

  stopPolling() {
    this.pollingEmulator$.next(false);
    this.pollingOCR$.next(false);
  }

  // called by emulator/game-state service to update the game data
  updateGameData(data: PolledGameData) {
    this.polledGameData$.next(data);
  }

  // called by emulator/game-state service to send a packet encoded as a BinaryEncoder
  // is not sent immediately, but is batched and sent by sendBatchedPackets() every second
  sendPacket(packet: BinaryEncoder) {
    this.assembler.addPacketContent(packet);
  }

  // called every second internally to send all accumulated data to the server
  sendBatchedPackets() {

    // console.log("sendData()");

    // if there are no packets to send, don't do anything
    if (!this.assembler.hasPackets()) {
      // console.log("No packets to send");
      return;
    }

    // encode the packets into Uint8Array, and send it to the server
    const binaryData = this.assembler.encode();
    this.websocket.sendBinaryMessage(binaryData);

    // clear the assembler for the next batch of packets
    this.assembler = new PacketAssembler();

  }

}
