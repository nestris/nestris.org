import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RoutingService } from './routing.service';
import { TabID } from '../models/tabs';
import { TetrisBoard } from '../models/tetris/tetris-board';
import { TetrominoType } from '../models/tetris/tetromino-type';
import { EmulatorService } from './emulator/emulator.service';

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
    private routingService: RoutingService,
    private emulatorService: EmulatorService,
  ) {

    // on play solo, start solo game
    this.routingService.onSwitchToTab(TabID.SOLO).subscribe(() => {
      this.startPolling();
    });
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
      if (this.platform$.getValue() === Platform.ONLINE) {
        this.pollEmulator();
      } else {
        this.pollOCR();
      }
    }, 1000 / 60); // poll at 60 fps
  }

  stopPolling() {
    if (this.pollingLoop !== undefined) {
      clearInterval(this.pollingLoop);
    }
  }

  // poll game data from integrated emulator and emit it
  pollEmulator() {
    const gameState = this.emulatorService.getGameState();
    if (gameState) {

      const status = gameState.getStatus();

      this.polledGameData$.next(new PolledGameData(
        gameState.getDisplayBoard(),
        gameState.getNextPieceType(),
        status.level,
        status.lines,
        status.score,
        gameState.getTrt(),
        gameState.getDrought(),
        gameState.getCurrentDAS(),
      ));
    }
  }

  // poll game data from OCR and emit it
  pollOCR() {

  }



  getPolledGameData(): Observable<PolledGameData> {
    return this.polledGameData$.asObservable();
  }

}
