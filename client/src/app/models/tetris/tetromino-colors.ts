import { ColorType } from "./tetris-board";
import { TetrominoType } from "./tetromino-type";

export function getColorTypeForTetromino(tetrominoType: TetrominoType): ColorType {
    switch (tetrominoType) {
        case TetrominoType.I_TYPE:
        case TetrominoType.O_TYPE:
        case TetrominoType.T_TYPE:
            return ColorType.WHITE;
        case TetrominoType.J_TYPE:
        case TetrominoType.S_TYPE:
            return ColorType.PRIMARY;
        default:
            return ColorType.SECONDARY;
    }
}

export class RGBColor {
    constructor(public readonly r: number, public readonly g: number, public readonly b: number) {}

    public toString(): string {
        return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }

}

export const COLOR_FIRST_COLORS_RGB: {[key: number]: RGBColor } = {
    0: new RGBColor(0,88,248),
    1: new RGBColor(0,168,0),
    2: new RGBColor(216,0,204),
    3: new RGBColor(0,88,248),
    4: new RGBColor(228,0,88),
    5: new RGBColor(88,248,152),
    6: new RGBColor(248,56,0),
    7: new RGBColor(104,68,252),
    8: new RGBColor(0,88,248),
    9: new RGBColor(248,56,0),
}

export const COLOR_SECOND_COLORS_RGB: {[key: number]: RGBColor } = {
    0: new RGBColor(60,188,252),
    1: new RGBColor(148,248,24),
    2: new RGBColor(248,120,248),
    3: new RGBColor(88,216,84),
    4: new RGBColor(88,248,152),
    5: new RGBColor(104,136,252),
    6: new RGBColor(124,124,124),
    7: new RGBColor(168,0,32),
    8: new RGBColor(248,56,0),
    9: new RGBColor(252,160,68),
}

export function getColorForLevel(colorType: ColorType, level: number = 0): string {
    level = level % 10;
    
    // TODO: map level to color
    if (colorType === ColorType.WHITE) {
        return 'rgb(255, 255, 255)';
    } else if (colorType === ColorType.PRIMARY) {
        return COLOR_FIRST_COLORS_RGB[level].toString();
    } else if (colorType === ColorType.SECONDARY) {
        return COLOR_SECOND_COLORS_RGB[level].toString();
    } else {
        throw new Error("getColorForLevel(): color type is empty");
    }
}

export function getColorForTetrominoAndLevel(tetrominoType: TetrominoType, level: number): string {
    return getColorForLevel(getColorTypeForTetromino(tetrominoType), level);
}