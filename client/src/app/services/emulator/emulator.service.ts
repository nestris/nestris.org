import { HostListener, Injectable } from '@angular/core';
import { CurrentlyPressedKeys, KeyManager } from './currently-pressed-keys';
import { Keybinds } from './keybinds';
import { EmulatorGameState } from './emulator-game-state';
import { RandomRNG } from '../../models/piece-sequence-generation/random-rng';

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

  private gameInterval: any;

  constructor() { }

  // starting game will create a game object and execute game frames at 60fps
  startGame(level: number) {

    if (this.currentState !== undefined) {
      throw new Error('Game already started');
    }

    console.log("starting game at level", level);

    // set all keys to unpressed
    this.keyManager.resetAll();

    // generate initial game state
    this.currentState = new EmulatorGameState(level, new RandomRNG());

    // start game loop at 60fps
    this.gameInterval = setInterval(
      () => {
        this.advanceEmulatorState();
      }, 1000 / 60 // game runs at 60fps
    );
  }

  // run emulator for one tick
  // if keyboard input, rollback and runahead
  // if topped out, stop game
  private advanceEmulatorState() {
    const pressedKeys = this.keyManager.generate();

    // if a key was just pressed or released, initiate rollback by
    // applying 
    if (pressedKeys.hasChanged() && this.previousState !== undefined) {

      // rollback to previous state and execute previous state with current keys
      this.previousState.executeFrame(pressedKeys);
      this.currentState = this.previousState;

      // re-execute current state after rollback
      this.currentState.executeFrame(pressedKeys.generateNext());  
    } else {
      // no rollback, just execute current state
      this.currentState?.executeFrame(pressedKeys);
    }

    // update previous state
    this.previousState = this.currentState?.copy();

    // if topped out, stop game
    if (this.currentState?.isToppedOut()) this.stopGame();
  }

  stopGame() {
    clearInterval(this.gameInterval);
    this.currentState = undefined;
    console.log("game stopped");
  }

  // returns the current game state, if there is one
  getGameState(): EmulatorGameState | undefined {
    return this.currentState;
  }

  // if matching keybind, update currently pressed keys on keydown
  handleKeydown(event: KeyboardEvent) {

    // ignore keydown events if game is not running
    if (this.currentState === undefined) return;

    console.log("keydown", event.key);

    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) {
      this.keyManager.onPress(keybind);
      event.stopPropagation();
      event.preventDefault();
    }
    
  }

  // if matching keybind, update currently pressed keys on keyup
  handleKeyup(event: KeyboardEvent) {

    // ignore keyup events if game is not running
    if (this.currentState === undefined) return;

    console.log("keyup", event.key);

    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) {
      this.keyManager.onRelease(keybind);
      event.stopPropagation();
      event.preventDefault();
    }
  }
}
