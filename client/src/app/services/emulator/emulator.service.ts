import { HostListener, Injectable } from '@angular/core';
import { CurrentlyPressedKeys, KeyManager } from './currently-pressed-keys';
import { Keybinds } from './keybinds';
import { EmulatorGameState } from './emulator-game-state';
import { RandomRNG } from '../../models/piece-sequence-generation/random-rng';
import { FpsTracker } from 'misc/fps-tracker';

/*
Emulates a NES game as a 60fps state machine with keyboard input
*/

@Injectable({
  providedIn: 'root'
})
export class EmulatorService {

  private keybinds = new Keybinds(); // probably should inject this instead
  private keyManager = new KeyManager();

  private previousState?: EmulatorGameState; // for runahead
  private currentState?: EmulatorGameState; // if not undefined, then game is currently going on

  private isPaused = false;

  private fpsTracker?: FpsTracker;

  private stoppingGame = false;


  constructor() {
  }

  // starting game will create a game object and execute game frames at 60fps
  // if slowmode, will execute games at 5ps instead
  startGame(level: number, slowMode: boolean = false) {

    console.log("starting game at level", level);

    this.fpsTracker = new FpsTracker();

    // set all keys to unpressed
    this.keyManager.resetAll();

    // generate initial game state
    this.currentState = new EmulatorGameState(level, new RandomRNG());

    // unpause
    this.isPaused = false;

    let fps: number;
    if (slowMode) fps = 5;
    else fps = 60;

    const epoch = performance.now();
    let framesDone = 0;

    const loop = () => {

      if (this.stoppingGame) {
        this.stoppingGame = false;
        return;
      }

      requestAnimationFrame(loop);
  
      // calculate how many frames to advance based on time elapsed to maintain 60fps
      const diff = performance.now() - epoch;
      const frames = diff / 1000 * fps | 0;
      const frameAmount = frames - framesDone;
  
      for (let i = 0; i < frameAmount; i++) {
        if (!this.isPaused) this.advanceEmulatorState();
      }

      framesDone = frames;
  };
  loop();

}

  // run emulator for one tick
  // if keyboard input, rollback and runahead
  // if topped out, stop game
  private advanceEmulatorState() {

    // tick fps tracker
    this.fpsTracker?.tick();
    console.log("FPS:", this.fpsTracker!.getFPS());
    
    const pressedKeys = this.keyManager.generate();


    // if a key was just pressed or released, initiate rollback by
    // applying 
    if (false && pressedKeys.hasChanged() && this.previousState !== undefined) {

      console.log("rollback");

      // // rollback to previous state and execute previous state with current keys
      // this.previousState.executeFrame(pressedKeys);
      // this.currentState = this.previousState;

      // // update previous state
      // this.previousState = this.currentState?.copy();

      // // re-execute current state after rollback
      // this.currentState.executeFrame(pressedKeys.generateNext());  
    } else {

      // update previous state
      this.previousState = this.currentState?.copy();

      // no rollback, just execute current state
      this.currentState?.executeFrame(pressedKeys);
    }

    // if topped out, stop game
    if (this.currentState?.isToppedOut()) this.stopGame();
  }

  stopGame() {
    this.fpsTracker = undefined;
    this.stoppingGame = true;
    console.log("game stopped");
  }


  // returns the current game state, if there is one
  getGameState(): EmulatorGameState | undefined {
    return this.currentState;
  }

  // if matching keybind, update currently pressed keys on keydown
  handleKeydown(event: KeyboardEvent) {

    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) {
      this.keyManager.onPress(keybind);
      event.stopPropagation();
      event.preventDefault();
    } else if (event.key === "Enter" && this.currentState !== undefined) {
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
