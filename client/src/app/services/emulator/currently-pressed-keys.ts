import { ALL_KEYBINDS, Keybind } from "./keybinds";

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

    private thisFramePressed: {[keybind in Keybind] : boolean} = {
        [Keybind.QUIT]: false,
        [Keybind.RESTART]: false,
        [Keybind.SHIFT_LEFT]: false,
        [Keybind.SHIFT_RIGHT]: false,
        [Keybind.ROTATE_LEFT]: false,
        [Keybind.ROTATE_RIGHT]: false,
        [Keybind.PUSHDOWN]: false,
    }

    private lastFramePressed: {[keybind in Keybind] : boolean} = {
        [Keybind.QUIT]: false,
        [Keybind.RESTART]: false,
        [Keybind.SHIFT_LEFT]: false,
        [Keybind.SHIFT_RIGHT]: false,
        [Keybind.ROTATE_LEFT]: false,
        [Keybind.ROTATE_RIGHT]: false,
        [Keybind.PUSHDOWN]: false,
    }

    onPress(keybind: Keybind) {
        console.log("onpress", keybind);
        this.pressed[keybind] = true;
    }

    onRelease(keybind: Keybind) {
        console.log("onrelease", keybind);
        this.pressed[keybind] = false;
    }

    tick() {
        ALL_KEYBINDS.forEach((keybind) => {
            this.lastFramePressed[keybind] = this.thisFramePressed[keybind];
            this.thisFramePressed[keybind] = this.pressed[keybind];
        });
    }

    isPressed(keybind: Keybind): boolean {
        return this.thisFramePressed[keybind];
    }

    isJustPressed(keybind: Keybind): boolean {
        return this.thisFramePressed[keybind] && !this.lastFramePressed[keybind];
    }

    isJustReleased(keybind: Keybind): boolean {
        return !this.thisFramePressed[keybind] && this.lastFramePressed[keybind];
    }

    print() {
        console.log(this.pressed);
    }
    
}