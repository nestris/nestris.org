import { Point } from "shared/tetris/point";
import { RGBColor } from "shared/tetris/tetromino-colors";

export interface Frame {
    
    get width(): number;
    get height(): number;

    getPixelAt(point: Point): RGBColor | undefined;
}

export class RGBFrame implements Frame {
    constructor(private readonly pixels: RGBColor[][]) {}

    get width(): number {
        return this.pixels[0].length;
    }

    get height(): number {
        return this.pixels.length;
    }

    getPixelAt(point: Point): RGBColor | undefined {
        if (point.x < 0 || point.x >= this.width || point.y < 0 || point.y >= this.height) return undefined;
        return this.pixels[point.y][point.x];
    }
} 