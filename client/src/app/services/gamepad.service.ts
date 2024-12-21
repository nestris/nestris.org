import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GamepadService {

  private previousPressed: string[] = [];
  private press$: Subject<string> = new Subject();

  constructor() {
    // Poll for pressed buttons at 20fps
    setInterval(() => {
      const pressed = this.getPressedButtons();
      for (const button of pressed) {
        if (!this.previousPressed.includes(button)) {
          this.press$.next(button);
          console.log('Pressed', button);
        }
      }
      this.previousPressed = pressed;
    }, 1000 / 20);
  }

  /**
   * Returns an observable that emits the button id when a button is pressed.
   * @returns An observable that emits the button id when a button is pressed.
   */
  onPress(): Observable<string> {
    return this.press$.asObservable();
  }

  /**
   * Gets the list of button ids that are currently pressed on the gamepad.
   * @returns An array of button ids that are currently pressed.
   */
  getPressedButtons(): string[] {

    const gamepad = navigator.getGamepads()[0];
    if (!gamepad) return [];

    const pressedButtons: string[] = [];

    // Go through buttons
    for (let i = 0; i < gamepad.buttons.length; i++) {
      if (gamepad.buttons[i].pressed) {
        pressedButtons.push(`GamepadButton${i}`);
      }
    }

    // Go through axes
    for (let i = 0; i < gamepad.axes.length; i++) {
      if (gamepad.axes[i] > 0.5) {
        pressedButtons.push(`GamepadAxis+${i}`);
      } else if (gamepad.axes[i] < -0.5) {
        pressedButtons.push(`GamepadAxis-${i}`);
      }
    }

    return pressedButtons;
  }

}
