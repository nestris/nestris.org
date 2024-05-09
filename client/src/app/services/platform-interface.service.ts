import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TetrisBoard } from '../../../../network-protocol/tetris/tetris-board';
import { TetrominoType } from '../../../../network-protocol/tetris/tetromino-type';
import { EmulatorService } from './emulator/emulator.service';
import { GameStateService } from './ocr/game-state.service';
import { NonGameBoardStateChangePacket, NonGameBoardStateChangeSchema } from 'network-protocol/stream-packets/packet';
import { PacketAssembler } from 'network-protocol/stream-packets/packet-assembler';
import { PacketDisassembler } from 'network-protocol/stream-packets/packet-disassembler';
import { EmulatorGameState } from './emulator/emulator-game-state';

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


/*
Routinely polls from either the online platform or the OCR platform, depending on which platform is selected.
*/

@Injectable({
  providedIn: 'root'
})
export class PlatformInterfaceService {

  private platform$ = new BehaviorSubject<Platform>(Platform.ONLINE);
  private polledGameData$ = new BehaviorSubject<PolledGameData | undefined>(undefined);

  private pollingLoop: any;

  private emulatorSubscription: any;
  private ocrSubscription: any;

  constructor(
    private emulatorService: EmulatorService, // for when platform is set to ONLINE
    private gameStateService: GameStateService, // for when platform is set to OCR
  ) {

  }

  getPolledGameData(): PolledGameData | undefined {
    return this.polledGameData$.getValue();
  }

  getPolledGameData$(): Observable<PolledGameData | undefined> {
    return this.polledGameData$.asObservable();
  }


  onPlatformChange(): Observable<Platform> {
    return this.platform$.asObservable();
  }

  setPlatform(platform: Platform) {
    this.platform$.next(platform);
  }

  startPolling() {
    
    if (this.emulatorSubscription) this.emulatorSubscription.unsubscribe();
    if (this.ocrSubscription) this.ocrSubscription.unsubscribe();

    if (this.platform$.getValue() === Platform.ONLINE) {
      this.emulatorSubscription = this.emulatorService.getGameState$().subscribe((gameState) => {
        this.pollEmulator(gameState);
      });

      this.emulatorService.startGame(18);
    } else {
      this.ocrSubscription = this.gameStateService.getOnUpdate$().subscribe(() => {
        this.pollOCR();
      });

      this.gameStateService.startCapture();
    }
  }

  stopPolling() {
    if (this.emulatorSubscription) this.emulatorSubscription.unsubscribe();
    if (this.ocrSubscription) this.ocrSubscription.unsubscribe();

    if (this.platform$.getValue() === Platform.ONLINE) {
      this.emulatorService.stopGame();
    } else {
      this.gameStateService.stopCapture();
    }
  }


  // poll game data from integrated emulator and emit it
  pollEmulator(gameState: EmulatorGameState | undefined): PolledGameData | undefined {

    if (!gameState) {
      this.polledGameData$.next(undefined);
      return undefined;
    }

    console.log("polling emulator");

    const status = gameState.getStatus();

    const data = new PolledGameData(
      gameState.getDisplayBoard(),
      gameState.getNextPieceType(),
      status.level,
      status.lines,
      status.score,
    );

    this.polledGameData$.next(data);
    return data;
  }

  // poll game data from OCR and emit it
  pollOCR(): PolledGameData | undefined {

    console.log("polling ocr");

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
    );

    this.polledGameData$.next(data);
    return data;
  }

}
