import { HostListener, Injectable } from '@angular/core';
import { CurrentlyPressedKeys } from './currently-pressed-keys';
import { Keybinds } from './keybinds';
import { EmulatorGameState } from './emulator-game-state';

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
    this.game = new EmulatorGameState(level);
    this.gameInterval = setInterval(
      () => this.game?.executeFrame(this.pressedKeys),
      1000 / 60
    );
  }

  // if matching keybind, update currently pressed keys on keydown
  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) this.pressedKeys.onPress(keybind);
  }

  // if matching keybind, update currently pressed keys on keyup
  @HostListener('window:keyup', ['$event'])
  handleKeyup(event: KeyboardEvent) {
    const keybind = this.keybinds.stringToKeybind(event.key);
    if (keybind) this.pressedKeys.onRelease(keybind);
  }
}
