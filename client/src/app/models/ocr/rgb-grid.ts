import { RGBColor } from "src/app/shared/tetris/tetromino-colors";


export class RGBGrid {

    private grid: RGBColor[][];

    constructor(public readonly width: number, public readonly height: number) {
        this.grid = new Array(height);
        for (let i = 0; i < height; i++) {
            this.grid[i] = new Array(width);
        }
    }

    getAt(x: number, y: number): RGBColor {
        return this.grid[y][x];
    }

    setAt(x: number, y: number, rgb: RGBColor): void {
        this.grid[y][x] = rgb;
    }

}