import { OCRBox } from "./ocr-box";
import { Pixels } from "./pixels";

// digit dimensions relative to main board box
const DIGIT_WIDTH = 0.108;
const DIGIT_HEIGHT = 0.049;

export function levelFromBoardBox(box: OCRBox): Textbox {
  const {x, y} = box.getCanvasPositionFromRelative({x: 1.49, y: 0.769});
  const {x: width, y: height} = box.getVectorFromRelative({x: DIGIT_WIDTH * 2, y: DIGIT_HEIGHT});
  return new Textbox(2, x, y, width, height);
}

export function scoreFromBoardBox(box: OCRBox): Textbox {
  const {x, y} = box.getCanvasPositionFromRelative({x: 1.27, y: 0.08});
  const {x: width, y: height} = box.getVectorFromRelative({x: DIGIT_WIDTH * 6, y: DIGIT_HEIGHT});
  return new Textbox(6, x, y, width, height);
}


export class Textbox {


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

  evaluateNumber(image: Pixels): number {
    return 0;
  }
  

}