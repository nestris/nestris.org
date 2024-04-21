import { OCRBox } from "./ocr-box";
import { Pixels } from "./pixels";

export function levelFromBoardBox(box: OCRBox): Textbox {
  const {x, y} = box.getCanvasPositionFromRelative({x: 1.501, y: 0.769});
  const {x: width, y: height} = box.getVectorFromRelative({x: 0.205, y: 0.049});
  return new Textbox(2, x, y, width, height);
}

export class Textbox {

  constructor(
    public readonly count: number, // number of digits
    public readonly x: number,
    public readonly y: number,
    public readonly width: number,
    public readonly height: number,
  ) {

  }

  evaluateNumber(image: Pixels): number {
    return 0;
  }
  

}