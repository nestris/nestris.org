import { HostListener, Injectable } from '@angular/core';
import { CurrentlyPressedKeys } from './currently-pressed-keys';
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
  private pressedKeys = new CurrentlyPressedKeys();

  private game?: EmulatorGameState; // if not undefined, then game is currently going on
  private gameInterval: any;

  constructor() { }

  // starting game will create a game object and execute game frames at 60fps
  startGame(level: number) {

    if (this.game !== undefined) {
      throw new Error('Game already started');
    }

    console.log("starting game at level", level);

    this.game = new EmulatorGameState(level, new RandomRNG());
    this.gameInterval = setInterval(
      () => {
        this.game?.executeFrame(this.pressedKeys);
        if (this.game?.isToppedOut()) this.stopGame();
      }, 1000 / 60 // game runs at 60fps
    );
  }

  stopGame() {
    clearInterval(this.gameInterval);
    this.game = undefined;
    console.log("game stopped");
  }

  // returns the current game state, if there is one
  getGameState(): EmulatorGameState | undefined {
    return this.game;
  }

  // if matching keybind, update currently pressed keys on keydown
  handleKeydown(event: KeyboardEvent) {

    // ignore keydown events if game is not running
    if (this.game === undefined) return;

    console.log("keydown", event.key);

    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) {
      this.pressedKeys.onPress(keybind);
      event.stopPropagation();
      event.preventDefault();
    }
    
  }

  // if matching keybind, update currently pressed keys on keyup
  handleKeyup(event: KeyboardEvent) {

    // ignore keyup events if game is not running
    if (this.game === undefined) return;

    console.log("keyup", event.key);

    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) {
      this.pressedKeys.onRelease(keybind);
      event.stopPropagation();
      event.preventDefault();
    }
  }
}
