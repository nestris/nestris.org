import { Keybind } from "./keybinds";

/*
Maintains a map of currently-pressed keybinds
*/
export class CurrentlyPressedKeys {

    private pressed: {[keybind in Keybind] : boolean} = {
        [Keybind.QUIT]: false,
        [Keybind.RESTART]: false,
        [Keybind.SHIFT_LEFT]: false,
        [Keybind.SHIFT_RIGHT]: false,
        [Keybind.ROTATE_LEFT]: false,
        [Keybind.ROTATE_RIGHT]: false,
        [Keybind.PUSHDOWN]: false,
    }

    onPress(keybind: Keybind) {
        this.pressed[keybind] = true;
    }

    onRelease(keybind: Keybind) {
        this.pressed[keybind] = false;
    }

    isPressed(keybind: Keybind): boolean {
        return this.pressed[keybind];
    }
    
}