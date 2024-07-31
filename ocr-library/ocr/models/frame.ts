import { RGBColor } from "shared/tetris/tetromino-colors";

export interface Frame {
    
    get width(): number;
    get height(): number;

    getPixelAt(x: number, y: number): RGBColor | undefined;
}

export class RGBFrame implements Frame {
    constructor(private readonly pixels: RGBColor[][]) {}

    get width(): number {
        return this.pixels[0].length;
    }

    get height(): number {
        return this.pixels.length;
    }

    getPixelAt(x: number, y: number): RGBColor | undefined {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return undefined;
        return this.pixels[y][x];
    }
} 