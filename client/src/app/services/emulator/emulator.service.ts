import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RandomRNG } from 'src/app/models/piece-sequence-generation/random-rng';
import { BinaryEncoder } from 'src/app/shared/network/binary-codec';
import { JsonMessageType } from 'src/app/shared/network/json-message';
import { GameStartPacket, GameCountdownPacket, GamePlacementPacket, GameAbbrBoardPacket, GameFullBoardPacket, GameEndPacket } from 'src/app/shared/network/stream-packets/packet';
import { FpsTracker } from 'src/app/shared/scripts/fps-tracker';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';
import { TimeDelta } from 'src/app/util/time-delta';
import { PlatformInterfaceService, Platform, PolledGameData } from '../platform-interface.service';
import { WebsocketService } from '../websocket.service';
import { KeyManager } from './currently-pressed-keys';
import { EmulatorGameState, EMULATOR_FPS } from './emulator-game-state';
import { Keybinds } from './keybinds';


/*
Emulates a NES game as a 60fps state machine with keyboard input
*/

@Injectable({
  providedIn: 'root'
})
export class EmulatorService {

  private keybinds = new Keybinds(); // probably should inject this instead
  private keyManager = new KeyManager();

  private currentState: EmulatorGameState | undefined = undefined;

  // BehaviorSubjects that are controlled by EmulatorMenuComponent
  private isPaused$ = new BehaviorSubject<boolean>(false);
  private selectedLevel$ = new BehaviorSubject<number>(9);

  private fpsTracker?: FpsTracker;

  private framesDone: number = 0;
  private epoch: number = performance.now();

  private loop: any;

  // used for calculating time elapsed between frames
  private timeDelta = new TimeDelta();

  // store previous data to check if data has changed
  private previousCountdown: number | undefined = undefined;
  private previousBoard: TetrisBoard = new TetrisBoard();

  constructor(
    private platform: PlatformInterfaceService,
    private websocket: WebsocketService
) {

    platform.getPollingEmulator$().subscribe((polling) => {

      if (polling) { // start emulator loop
        if (!this.loop) {
          this.timeDelta.resetDelta();
          this.previousCountdown = undefined;
          this.startGame(this.selectedLevel$.getValue(), false);
          this.loop = setInterval(() => this.tick(), 0);
        }
      } else { // stop emulator loop
        if (this.loop) {
          clearInterval(this.loop);
          this.loop = undefined;
          this.stopGame();
        }
      }
    });

  }

  tick() {

    if (this.currentState === undefined) return;
    
    // calculate how many frames to advance based on time elapsed to maintain 60fps
    const diff = performance.now() - this.epoch;
    const frames = diff / 1000 * EMULATOR_FPS | 0;
    const frameAmount = frames - this.framesDone;

    for (let i = 0; i < frameAmount; i++) {
      if (!this.isPaused$.getValue()) this.advanceEmulatorState();
    }

    this.framesDone = frames;

  }

  // starting game will create a game object and execute game frames at 60fps
  // if slowmode, will execute games at 5ps instead
  startGame(level: number, startPaused: boolean) {

    console.log("starting game at level", level);

    this.fpsTracker = new FpsTracker();

    // set all keys to unpressed
    this.keyManager.resetAll();

    // start paused
    this.isPaused$.next(startPaused);


    this.epoch = performance.now();
    this.framesDone = 0;

    // generate initial game state
    this.currentState = new EmulatorGameState(level, new RandomRNG());

    // send game start packet
    const current = this.currentState.getCurrentPieceType();
    const next = this.currentState.getNextPieceType();
    this.platform.sendPacket(new GameStartPacket().toBinaryEncoder({level, current, next}));

}

  // run emulator for one tick
  // if keyboard input, rollback and runahead
  // if topped out, stop game
  private advanceEmulatorState() {

    // tick fps tracker
    this.fpsTracker?.tick();
    
    const pressedKeys = this.keyManager.generate();

    if (!this.currentState) return;

    // execute frame
    const result = this.currentState.executeFrame(pressedKeys);
    const newBoard = this.currentState.getDisplayBoard();

    // update game data
    const data: PolledGameData = {
      board: newBoard,
      level: this.currentState.getStatus().level,
      score: this.currentState.getStatus().score,
      lines: this.currentState.getStatus().lines,
      nextPiece: this.currentState.getNextPieceType(),
      countdown: this.currentState.getCountdown(),
    };
    this.platform.updateGameData(data);

    // send countdown packet if countdown has changed
    const currentCountdown = this.currentState.getCountdown();
    if (currentCountdown !== this.previousCountdown) {
      this.platform.sendPacket(new GameCountdownPacket().toBinaryEncoder({
        delta: this.timeDelta.getDelta(),
        countdown: currentCountdown ?? 0,
      }));
      this.previousCountdown = currentCountdown;
    }

    // send placement packet if piece has been placed
    if (result.newPieceSpawned && !result.toppedOut) {
      this.platform.sendPacket(new GamePlacementPacket().toBinaryEncoder({
        delta: this.timeDelta.getDelta(),
        nextNextType: this.currentState.getNextPieceType(),
        mtPose: result.lockedPiece!.getMTPose(),
        pushdown: 0 // TODO: calculate pushdown
      }));
    }

    // send packet with board info if board has changed
    if (!this.previousBoard.equals(newBoard)) {

      const activePiece = this.currentState.getActivePiece();

      if (activePiece) {
        // if there's an active piece, send abbreviated packet to save bandwidth
        this.platform.sendPacket(new GameAbbrBoardPacket().toBinaryEncoder({
          delta: this.timeDelta.getDelta(),
          mtPose: activePiece.getMTPose(),
        }));

      } else {
        // send full state, since there is no active piece to send abbreviated packet info
        this.platform.sendPacket(new GameFullBoardPacket().toBinaryEncoder({
          delta: this.timeDelta.getDelta(),
          board: newBoard,
        }));
      }

      this.previousBoard = newBoard;
    }
    
    // if topped out, stop game
    if (this.currentState.isToppedOut()) this.stopGame();

  }

  stopGame() {

    // if game is already stopped, do nothing
    if (this.currentState === undefined) return;

    this.fpsTracker = undefined;
    this.currentState = undefined;
    console.log("game stopped");

    // send game end packet
    this.platform.sendPacket(new GameEndPacket().toBinaryEncoder({}));
  }



  // if matching keybind, update currently pressed keys on keydown
  handleKeydown(event: KeyboardEvent) {

    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) {
      this.keyManager.onPress(keybind);
      event.stopPropagation();
      event.preventDefault();
    } else if (["Enter", " "].includes(event.key) && this.currentState) { // toggle pause
      this.togglePaused();
    } else if (event.key === "r") { // restart game
      this.resetGame();
    }
  }

  // if matching keybind, update currently pressed keys on keyup
  handleKeyup(event: KeyboardEvent) {

    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) {
      this.keyManager.onRelease(keybind);
      event.stopPropagation();
      event.preventDefault();
    }
  }

  resetGame() {
    this.stopGame();
    this.startGame(this.selectedLevel$.getValue(), false);
  }

  getPaused$(): Observable<boolean> {
    return this.isPaused$.asObservable();
  }

  togglePaused() {
    this.isPaused$.next(!this.isPaused$.getValue())
  }

  getSelectedLevel$(): Observable<number> {
    return this.selectedLevel$.asObservable();
  }

  setSelectedLevel(level: number) {

    if (level < 0 || level > 29) {
      console.error("Cannot set level to", level);
      return;
    }

    this.selectedLevel$.next(level);
  }

  // returns the average number of ticks per second over the last second
  getFPS(): number {
    return this.fpsTracker?.getFPS() ?? 0;
  }
}
