import { AfterViewInit, HostListener, Injectable, OnInit } from '@angular/core';
import { CurrentlyPressedKeys, KeyManager } from './currently-pressed-keys';
import { Keybinds } from './keybinds';
import { EmulatorGameState } from './emulator-game-state';
import { RandomRNG } from '../../models/piece-sequence-generation/random-rng';
import { FpsTracker } from 'misc/fps-tracker';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { BinaryEncoder } from 'network-protocol/binary-codec';
import { PlatformInterfaceService, PolledGameData } from '../platform-interface.service';
import { set } from 'mongoose';
import { GameEndPacket, GameFullBoardPacket, GamePlacementPacket, GameStartPacket } from 'network-protocol/stream-packets/packet';

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

  private isPaused = false;

  private fpsTracker?: FpsTracker;

  private fps: number = 60;
  private framesDone: number = 0;
  private epoch: number = performance.now();

  private loop: any;


  constructor(private platform: PlatformInterfaceService) {

    platform.getPollingEmulator$().subscribe((polling) => {

      if (polling) { // start emulator loop
        if (!this.loop) {
          this.startGame(18);
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
    const frames = diff / 1000 * this.fps | 0;
    const frameAmount = frames - this.framesDone;

    for (let i = 0; i < frameAmount; i++) {
      if (!this.isPaused) this.advanceEmulatorState();
    }

    this.framesDone = frames;

  }

  // starting game will create a game object and execute game frames at 60fps
  // if slowmode, will execute games at 5ps instead
  startGame(level: number, slowMode: boolean = false) {

    console.log("starting game at level", level);

    this.fpsTracker = new FpsTracker();

    // set all keys to unpressed
    this.keyManager.resetAll();

    // unpause
    this.isPaused = false;

    if (slowMode) this.fps = 5;
    else this.fps = 60;

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

    const oldBoard = this.currentState.getDisplayBoard();

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
    };
    this.platform.updateGameData(data);

    // send placement packet if piece has been placed
    if (result.newPieceSpawned) {
      this.platform.sendPacket(new GamePlacementPacket().toBinaryEncoder({
        nextNextType: this.currentState.getNextPieceType(),
        rotation: result.lockedPiece!.getRotation(),
        x: result.lockedPiece!.getTranslateX(),
        y: result.lockedPiece!.getTranslateY(),
        pushdown: 0 // TODO: calculate pushdown
      }));
    }

    // send packet with board info if board has changed
    if (!oldBoard.equals(newBoard)) {
      this.platform.sendPacket(new GameFullBoardPacket().toBinaryEncoder({
        delta: 0, // TODO: calculate delta
        board: newBoard,
      }));
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
    } else if (event.key === "Enter" && this.currentState) { // toggle pause
      this.isPaused = !this.isPaused;
    } else if (event.key === "r") { // restart game
      this.stopGame();
      this.startGame(18);
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

  // returns the average number of ticks per second over the last second
  getFPS(): number {
    return this.fpsTracker?.getFPS() ?? 0;
  }
}
