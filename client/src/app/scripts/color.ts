import { RGBColor } from "../shared/tetris/tetromino-colors";

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
