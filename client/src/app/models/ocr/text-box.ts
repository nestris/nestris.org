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

export function linesFromBoardBox(box: OCRBox): Textbox {
  const {x, y} = box.getCanvasPositionFromRelative({x: 0.72, y: -0.182});
  const {x: width, y: height} = box.getVectorFromRelative({x: DIGIT_WIDTH * 3, y: DIGIT_HEIGHT});
  return new Textbox(3, x, y, width, height);
}

export function scoreFromBoardBox(box: OCRBox): Textbox {
  const {x, y} = box.getCanvasPositionFromRelative({x: 1.27, y: 0.08});
  const {x: width, y: height} = box.getVectorFromRelative({x: DIGIT_WIDTH * 6, y: DIGIT_HEIGHT});
  return new Textbox(6, x, y, width, height);
}

export interface TextboxResult {
  value: number; // ocr result
  confidence: number; // 0-1
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

  private evaluteDigit(image: Pixels, digit: number): TextboxResult {
    const rect = this.getDigitRect(digit);
    return {
      value: 0,
      confidence: 0,
    }
  
  }

  evaluateNumber(image: Pixels): TextboxResult {

    // evaluate each digit
    const result = Array.from({length: this.count}, (_, i) => this.evaluteDigit(image, i));

    // calculate number from digits
    const number = result.reduce((acc, {value}, i) => acc + value * Math.pow(10, this.count - i - 1), 0);

    // average confidence
    const confidence = result.reduce((acc, {confidence}) => acc + confidence, 0) / this.count;

    return {
      value: number,
      confidence,
    };
  }
  

}