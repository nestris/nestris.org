import { ALL_KEYBINDS, Keybind, keybindToName } from "./keybinds";

/*
Struct storing the key state for a single frame
*/
export class CurrentlyPressedKeys {
    constructor(
        public readonly thisFramePressed: {[keybind in Keybind] : boolean},
        public readonly lastFramePressed: {[keybind in Keybind] : boolean},
    ) {}

    // whether a keybind is pressed this frame
    isPressed(keybind: Keybind): boolean {
        return this.thisFramePressed[keybind];
    }

    // whether a keybind was just pressed this frame
    isJustPressed(keybind: Keybind): boolean {
        return this.thisFramePressed[keybind] && !this.lastFramePressed[keybind];
    }

    // whether a keybind was just released this frame
    isJustReleased(keybind: Keybind): boolean {
        return !this.thisFramePressed[keybind] && this.lastFramePressed[keybind];
    }

    toString(): string {
        let str = "";
        ALL_KEYBINDS.forEach((keybind) => {
            if (this.isPressed(keybind)) str += keybindToName(keybind) + " ";
        });
        return str;
    }

    // whether any keybind was just pressed or released this frame
    // useful for runahead
    hasChanged(): boolean {
        for (let keybind of ALL_KEYBINDS) {
            if (this.isJustPressed(keybind) || this.isJustReleased(keybind)) return true;
        }
        return false;
    }

    // generate a new CurrentlyPressedKeys struct with same thisFramePressed,
    // but lastFramePressed is set also set to thisFramePressed
    // so that isJustPressed and isJustReleased will return false
    generateNext(): CurrentlyPressedKeys {
        return new CurrentlyPressedKeys(this.thisFramePressed, this.thisFramePressed);
    }
}

/*
Handles async keyboard events and generates immutable CurrentlyPressedKeys structs
*/
export class KeyManager {

    private pressed: {[keybind in Keybind] : boolean} = {
        [Keybind.SHIFT_LEFT]: false,
        [Keybind.SHIFT_RIGHT]: false,
        [Keybind.ROTATE_LEFT]: false,
        [Keybind.ROTATE_RIGHT]: false,
        [Keybind.PUSHDOWN]: false,
    }

    private thisFramePressed: {[keybind in Keybind] : boolean} = {
        [Keybind.SHIFT_LEFT]: false,
        [Keybind.SHIFT_RIGHT]: false,
        [Keybind.ROTATE_LEFT]: false,
        [Keybind.ROTATE_RIGHT]: false,
        [Keybind.PUSHDOWN]: false,
    }

    private lastFramePressed: {[keybind in Keybind] : boolean} = {
        [Keybind.SHIFT_LEFT]: false,
        [Keybind.SHIFT_RIGHT]: false,
        [Keybind.ROTATE_LEFT]: false,
        [Keybind.ROTATE_RIGHT]: false,
        [Keybind.PUSHDOWN]: false,
    }

    public static readonly ALL_KEYS_UNPRESSED = new CurrentlyPressedKeys(
        {
            [Keybind.SHIFT_LEFT]: false,
            [Keybind.SHIFT_RIGHT]: false,
            [Keybind.ROTATE_LEFT]: false,
            [Keybind.ROTATE_RIGHT]: false,
            [Keybind.PUSHDOWN]: false,
        },
        {
            [Keybind.SHIFT_LEFT]: false,
            [Keybind.SHIFT_RIGHT]: false,
            [Keybind.ROTATE_LEFT]: false,
            [Keybind.ROTATE_RIGHT]: false,
            [Keybind.PUSHDOWN]: false,
        }
    )

    onPress(keybind: Keybind) {
        this.pressed[keybind] = true;
    }

    onRelease(keybind: Keybind) {
        this.pressed[keybind] = false;
    }

    resetAll() {
        ALL_KEYBINDS.forEach((keybind) => {
            this.pressed[keybind] = false;
            this.thisFramePressed[keybind] = false;
            this.lastFramePressed[keybind] = false;
        });
    }

    // generate a new CurrentlyPressedKeys struct.
    // call this exactly ONCE per frame. calling this will reset the "just pressed" state of all keybinds
    generate(): CurrentlyPressedKeys {

        ALL_KEYBINDS.forEach((keybind) => {
            this.lastFramePressed[keybind] = this.thisFramePressed[keybind];
            this.thisFramePressed[keybind] = this.pressed[keybind];
        });

        return new CurrentlyPressedKeys(this.thisFramePressed, this.lastFramePressed);
    }

    // returns the most recent state without polling for new events
    peek(): CurrentlyPressedKeys {
        return new CurrentlyPressedKeys(this.thisFramePressed, this.thisFramePressed);
    }


    print() {
        console.log(this.pressed);
    }
    
}