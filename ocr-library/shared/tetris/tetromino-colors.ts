import { ColorType } from "./tetris-board";
import { TetrominoType } from "./tetromino-type";

export type HSVColor = {
    h: number;
    s: number;
    v: number;
}

export function rgbToHsv(rgb: RGBColor): HSVColor {
    let rPrime = rgb.r / 255;
    let gPrime = rgb.g / 255;
    let bPrime = rgb.b / 255;

    let max = Math.max(rPrime, gPrime, bPrime);
    let min = Math.min(rPrime, gPrime, bPrime);
    let delta = max - min;

    let h: number;
    let s: number;
    let v = max * 100;

    if (delta === 0) {
        h = 0;
        s = 0;
    } else {
        s = (delta / max) * 100;

        if (max === rPrime) {
            h = ((gPrime - bPrime) / delta + (gPrime < bPrime ? 6 : 0)) * 60;
        } else if (max === gPrime) {
            h = ((bPrime - rPrime) / delta + 2) * 60;
        } else {
            h = ((rPrime - gPrime) / delta + 4) * 60;
        }
    }

    return { h, s, v };
}

export function hsvToRgb(hsv: HSVColor): RGBColor {

    const {h, s, v} = hsv;

    let sPrime = s / 100;
    let vPrime = v / 100;

    let c = vPrime * sPrime;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = vPrime - c;

    let rPrime: number;
    let gPrime: number;
    let bPrime: number;

    if (h < 60) {
        rPrime = c;
        gPrime = x;
        bPrime = 0;
    } else if (h < 120) {
        rPrime = x;
        gPrime = c;
        bPrime = 0;
    } else if (h < 180) {
        rPrime = 0;
        gPrime = c;
        bPrime = x;
    } else if (h < 240) {
        rPrime = 0;
        gPrime = x;
        bPrime = c;
    } else if (h < 300) {
        rPrime = x;
        gPrime = 0;
        bPrime = c;
    } else {
        rPrime = c;
        gPrime = 0;
        bPrime = x;
    }

    return new RGBColor(
        Math.round((rPrime + m) * 255),
        Math.round((gPrime + m) * 255),
        Math.round((bPrime + m) * 255)
    );
}


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

    get average(): number {
        return (this.r + this.g + this.b) / 3;
    }

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
    if (level < 0) level = 0;
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

function findMostSimilarColor(color1: RGBColor, color2: RGBColor, targetColor: RGBColor): RGBColor {
    // Function to calculate the Euclidean distance between two colors
    const colorDistance = (c1: RGBColor, c2: RGBColor): number => {

        const h1 = rgbToHsv(c1);
        const h2 = rgbToHsv(c2);

        return Math.sqrt(Math.pow(h2.h - h1.h, 2) + Math.pow(h2.s - h1.s, 2) + Math.pow(h2.v - h1.v, 2));
    };

    // Calculating the distance of each color to the target color
    const distance1 = colorDistance(color1, targetColor);
    const distance2 = colorDistance(color2, targetColor);

    // Determining the color with the minimum distance
    return (distance1 < distance2) ? color1 : color2;
}

// given a raw RGB color and a level, find closest color in level that matches
export function classifyColor(level: number, colorToClassify: RGBColor): ColorType {

    if (colorToClassify.average > 245) return ColorType.WHITE;

    level = level % 10;
    const colorFirst = COLOR_FIRST_COLORS_RGB[level];
    const colorSecond = COLOR_SECOND_COLORS_RGB[level];

    const mostSimilarColor = findMostSimilarColor(colorFirst, colorSecond, colorToClassify);

    if (mostSimilarColor === colorFirst) return ColorType.PRIMARY;
    else return ColorType.SECONDARY;
}

export function colorDistance(color1: RGBColor, color2: RGBColor): number {
    return Math.sqrt(Math.pow(color2.r - color1.r, 2) + Math.pow(color2.g - color1.g, 2) + Math.pow(color2.b - color1.b, 2));
}

export function averageRGB(colors: RGBColor[]): RGBColor {
    if (colors.length === 0) {
        return new RGBColor(0, 0, 0); // Default to black if the list is empty
    }

    const total = colors.length;
    const rSum = colors.reduce((sum, color) => sum + color.r, 0);
    const gSum = colors.reduce((sum, color) => sum + color.g, 0);
    const bSum = colors.reduce((sum, color) => sum + color.b, 0);

    return new RGBColor(
        Math.round(rSum / total),
        Math.round(gSum / total),
        Math.round(bSum / total)
    );
}