export enum Keybind {
    SHIFT_LEFT = 2,
    SHIFT_RIGHT = 3,
    ROTATE_LEFT = 4,
    ROTATE_RIGHT = 5,
    PUSHDOWN = 6
}

export const ALL_KEYBINDS = [
    Keybind.SHIFT_LEFT,
    Keybind.SHIFT_RIGHT,
    Keybind.ROTATE_LEFT,
    Keybind.ROTATE_RIGHT,
    Keybind.PUSHDOWN
]

const KEYBIND_TO_NAME: {[keybind in Keybind] : string} = {
    [Keybind.SHIFT_LEFT] : "L",
    [Keybind.SHIFT_RIGHT] : "R",
    [Keybind.ROTATE_LEFT] : "Z",
    [Keybind.ROTATE_RIGHT] : "X",
    [Keybind.PUSHDOWN] : "D",
}

export function keybindToName(keybind: Keybind): string {
    return KEYBIND_TO_NAME[keybind];
}

/*
Struct storing all the keybinds
*/
export class Keybinds {

    private keybinds: {[keybind in Keybind] : string} = {
        [Keybind.SHIFT_LEFT] : ",",
        [Keybind.SHIFT_RIGHT] : ".",
        [Keybind.ROTATE_LEFT] : "z",
        [Keybind.ROTATE_RIGHT] : "x",
        [Keybind.PUSHDOWN] : "ArrowDown",
    }

    stringToKeybind(key: string): Keybind | undefined {
        let foundKeybind: Keybind | undefined = undefined;
        ALL_KEYBINDS.forEach((keybind) => {
            if (this.keybinds[keybind] === key) foundKeybind = keybind;
        });
        return foundKeybind;
    }

    getKeybind(keybind: Keybind): string {
        return this.keybinds[keybind];
    }

    setKeybind(keybind: Keybind, key: string) {
        this.keybinds[keybind] = key;
    }

}