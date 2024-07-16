import { OCRBox } from "./ocr-box";
import { Pixels } from "./pixels";

// digit dimensions relative to main board box
const DIGIT_WIDTH = 0.108;
const DIGIT_HEIGHT = 0.051;

export function levelFromBoardBox(box: OCRBox): Textbox {
  const {x, y} = box.getCanvasPositionFromRelative({x: 1.49, y: 0.765});
  const {x: width, y: height} = box.getVectorFromRelative({x: DIGIT_WIDTH * 2, y: DIGIT_HEIGHT});
  return new Textbox(2, x, y, width, height);
}

export function linesFromBoardBox(box: OCRBox): Textbox {
  const {x, y} = box.getCanvasPositionFromRelative({x: 0.72, y: -0.187});
  const {x: width, y: height} = box.getVectorFromRelative({x: DIGIT_WIDTH * 3, y: DIGIT_HEIGHT});
  return new Textbox(3, x, y, width, height);
}

export function scoreFromBoardBox(box: OCRBox): Textbox {
  const {x, y} = box.getCanvasPositionFromRelative({x: 1.27, y: 0.077});
  const {x: width, y: height} = box.getVectorFromRelative({x: DIGIT_WIDTH * 6, y: DIGIT_HEIGHT});
  return new Textbox(6, x, y, width, height);
}

export interface TextboxResult {
  value: number; // ocr result
  confidence: number; // 0-1
}


export class Textbox {

  readonly RESOLUTION = 16;

  constructor(
    public readonly count: number, // number of digits
    public readonly x: number,
    public readonly y: number,
    public readonly width: number,
    public readonly height: number,
  ) {}

  getDigitRect(i: number): {
    x: number,
    y: number,
    width: number,
    height: number,
  } {
    const digitWidth = this.width / this.count;
    return {
      x: this.x + i * digitWidth,
      y: this.y,
      width: digitWidth,
      height: this.height,
    };
  }

  private getDigitMatrixForDigit(image: Pixels, index: number): boolean[][] {
    const rect = this.getDigitRect(index);
    
    // generate a 16x16 array of coordinates for the digit
    let coordinates: boolean[][] = [];
    for (let y = 0; y < this.RESOLUTION; y++) {
      coordinates.push([]);
      for (let x = 0; x < this.RESOLUTION; x++) {

        const startX = Math.floor(rect.x + x * rect.width / this.RESOLUTION);
        const endX = Math.floor(rect.x + (x + 1) * rect.width / this.RESOLUTION);

        const startY = Math.floor(rect.y + y * rect.height / this.RESOLUTION);
        const endY = Math.floor(rect.y + (y + 1) * rect.height / this.RESOLUTION);

        // get the average color of the region
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const pixel = image.getPixelAt(x, y);
            if (pixel) {
              r += pixel.r;
              g += pixel.g;
              b += pixel.b;
              count++;
            }
          }
        }
        const average = count > 0 ? {r: r / count, g: g / count, b: b / count} : {r: 0, g: 0, b: 0};
        const isWhite = (average.r + average.g + average.b) / 3 > 128;
        coordinates[coordinates.length - 1].push(isWhite);
        
      }
    }

    return coordinates;
  }

  getDigitMatrices(image: Pixels): boolean[][][] {
    return Array.from({length: this.count}, (_, i) => this.getDigitMatrixForDigit(image, i));
  }

}