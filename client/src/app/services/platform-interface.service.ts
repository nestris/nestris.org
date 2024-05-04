import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TetrisBoard } from '../../../../network-protocol/tetris/tetris-board';
import { TetrominoType } from '../../../../network-protocol/tetris/tetromino-type';
import { EmulatorService } from './emulator/emulator.service';
import { GameStateService } from './ocr/game-state.service';
import { NonGameBoardStateChangePacket } from 'network-protocol/stream-packets/packet';
import { PacketAssembler } from 'network-protocol/stream-packets/packet-assembler';

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
    public readonly trt: number,
    public readonly drought?: number,
    public readonly das?: number,
  ) {}
} 

/*
Routinely polls from either the online platform or the OCR platform, depending on which platform is selected.
*/

@Injectable({
  providedIn: 'root'
})
export class PlatformInterfaceService {

  private platform$ = new BehaviorSubject<Platform>(Platform.ONLINE);
  private polledGameData$ = new BehaviorSubject<PolledGameData>(new PolledGameData(
    new TetrisBoard(), // empty board
    TetrominoType.ERROR_TYPE, // next piece
    18, // level
    0, // lines
    0, // score
    0, // trt
  ));

  private pollingLoop: any;

  constructor(
    private emulatorService: EmulatorService, // for when platform is set to ONLINE
    private gameStateService: GameStateService, // for when platform is set to OCR
  ) {

  }

  onPlatformChange(): Observable<Platform> {
    return this.platform$.asObservable();
  }

  setPlatform(platform: Platform) {
    this.platform$.next(platform);
  }

  startPolling() {

    // stop any existing polling
    this.stopPolling();

    // start polling
    this.pollingLoop = setInterval(() => {
      this.poll();
    }, 1000 / 60); // poll at 60 fps

    this.platform$.getValue() === Platform.ONLINE ? this.startEmulator() : this.startOCR();
  }

  stopPolling() {
    if (this.pollingLoop !== undefined) {
      clearInterval(this.pollingLoop);

      this.platform$.getValue() === Platform.ONLINE ? this.stopEmulator() : this.stopOCR();

    }
  }

  startEmulator() {
    this.emulatorService.startGame(18);
  }

  stopEmulator() {
    this.emulatorService.stopGame();
  }

  startOCR() {
    this.gameStateService.startCapture();
  }

  stopOCR() {
    this.gameStateService.stopCapture();
  }

  // one poll iteration
  poll() {

    // poll from the appropriate platform
    let data: PolledGameData | undefined;
    if (this.platform$.getValue() === Platform.ONLINE) {
      data = this.pollEmulator();
    } else {
      data = this.pollOCR();
    }

    // if data was polled, send it to the server
    if (data) {
      // TODO: send data to server

      // log packets for now
      const assembler = new PacketAssembler();
      const packet = new NonGameBoardStateChangePacket();
      const packetData = packet.toBinaryEncoder({deltaMs: 0, board: data.board});
      assembler.addPacketContent(packetData);
      assembler.printBits();
    }

  }

  // poll game data from integrated emulator and emit it
  pollEmulator(): PolledGameData | undefined {
    const gameState = this.emulatorService.getGameState();
    if (!gameState) return;

    const status = gameState.getStatus();

    const data = new PolledGameData(
      gameState.getDisplayBoard(),
      gameState.getNextPieceType(),
      status.level,
      status.lines,
      status.score,
      gameState.getTrt(),
      gameState.getDrought(),
      gameState.getCurrentDAS(),
    );

    this.polledGameData$.next(data);
    return data;
  }

  // poll game data from OCR and emit it
  pollOCR(): PolledGameData | undefined {

    const board = this.gameStateService.getBoard();
    const nextPiece = this.gameStateService.getNextPiece();
    const level = this.gameStateService.getLevel();
    const lines = this.gameStateService.getLines();
    const score = this.gameStateService.getScore();
    const trt = this.gameStateService.getTrt();

    const data = new PolledGameData(
      board,
      nextPiece,
      level,
      lines,
      score,
      trt
    );

    this.polledGameData$.next(data);
    return data;
  }



  getPolledGameData(): Observable<PolledGameData> {
    return this.polledGameData$.asObservable();
  }

}
