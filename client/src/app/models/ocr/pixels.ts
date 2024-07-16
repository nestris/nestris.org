/*
Stores the Uint8ClampedArray for a single frame of video capture.
Exposes a method to get individual pixels from the frame.
*/

import { RGBColor } from "src/app/shared/tetris/tetromino-colors";


export class Pixels {

    constructor(
        public readonly pixels: Uint8ClampedArray,
        public readonly width: number,
        public readonly height: number,
    ) {}

    // get RGB for pixel at (x, y), A is ignored
  public getPixelAt(x: number, y: number): RGBColor | undefined {

    if (x < 0 || x >= this.width!) {
      return undefined;
    }

    if (y < 0 || y >= this.height!) {
      return undefined;
    }

    x = Math.floor(x);
    y = Math.floor(y);

    const index = (y * this.width! + x) * 4;
    return {
        r: this.pixels[index],
        g: this.pixels[index + 1],
        b: this.pixels[index + 2],
    };
  }


}