import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FloodFill } from 'src/app/models/ocr/floodfill';
import { OCRBox, BOARD_OCR_POSITION, BOARD_SHINE_OCR_POSITION, OCRPosition, NEXT_OCR_POSITION } from 'src/app/models/ocr/ocr-box';
import { Pixels } from 'src/app/models/ocr/pixels';
import { Textbox, TextboxResult, levelFromBoardBox, linesFromBoardBox, scoreFromBoardBox } from 'src/app/models/ocr/text-box';
import { rgbToHsv } from 'src/app/scripts/color';
import { TetrisBoard, ColorType } from 'src/app/shared/tetris/tetris-board';
import { classifyColor, RGBColor } from 'src/app/shared/tetris/tetromino-colors';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';
import { NextBoxOCR } from './next-box-ocr';
import { OcrDigitService } from './ocr-digit.service';
import { Point } from 'src/app/shared/tetris/point';


/*
Service to poll current video capture frame for different OCR results
Since you might not need all the OCR data every frame, poll only what's needed
*/

export enum OCRType {
  BOARD = "BOARD",
  BOARD_SHINE = "BOARD_SHINE",
  NEXT = "NEXT",
}

export enum TextboxType {
  LEVEL = "Level",
  LINES = "Lines",
  SCORE = "Score",
}

export const ALL_TEXTBOX_TYPES = Object.values(TextboxType);

@Injectable({
  providedIn: 'root'
})
export class OcrService {

  private readonly BLOCK_SHINE_VALUE_THRESHOLD = 10;

  private ocr$ = {
    [OCRType.BOARD]: new BehaviorSubject<OCRBox | undefined>(undefined),
    [OCRType.BOARD_SHINE]: new BehaviorSubject<OCRBox | undefined>(undefined),
    [OCRType.NEXT]: new BehaviorSubject<OCRBox | undefined>(undefined),
  }

  private board$ = new BehaviorSubject<TetrisBoard | undefined>(undefined);
  private nextBox$ = new BehaviorSubject<NextBoxOCR | undefined>(undefined);
  private nextType$ = new BehaviorSubject<TetrominoType | undefined>(undefined);

  private textBoxes$ = {
    [TextboxType.LEVEL]: new BehaviorSubject<Textbox | undefined>(undefined),
    [TextboxType.LINES]: new BehaviorSubject<Textbox | undefined>(undefined),
    [TextboxType.SCORE]: new BehaviorSubject<Textbox | undefined>(undefined),
  }

  private textBoxResults$ = {
    [TextboxType.LEVEL]: new BehaviorSubject<TextboxResult | undefined>(undefined),
    [TextboxType.LINES]: new BehaviorSubject<TextboxResult | undefined>(undefined),
    [TextboxType.SCORE]: new BehaviorSubject<TextboxResult | undefined>(undefined),
  }

  constructor(
    private ocrDigitService: OcrDigitService
  ) {}


  // if each varies by less than 30, then they are similar
  private floodfillCondition(colorA: RGBColor, colorB: RGBColor): boolean {
    return Math.abs(colorA.r - colorB.r) < 30 &&
      Math.abs(colorA.g - colorB.g) < 30 &&
      Math.abs(colorA.b - colorB.b) < 30;
  }

  private calibrateBoardOCR(image: Pixels, mouseX: number, mouseY: number) {
    const floodfill = new FloodFill(image.width, image.height);
    floodfill.floodfill(image, mouseX, mouseY, this.floodfillCondition.bind(this));
    const floodfillRect = floodfill.getBoundingRect();
    if (!floodfillRect) {
      throw new Error("floodfill failed");
    }
    console.log("set boardOCRBox", floodfillRect);
    this.ocr$[OCRType.BOARD].next(new OCRBox(floodfillRect, BOARD_OCR_POSITION));
    this.ocr$[OCRType.BOARD_SHINE].next(new OCRBox(floodfillRect, BOARD_SHINE_OCR_POSITION));
  }

  // given an image and OCR type, define an OCR bounding box positioned relative to main board through locations param
  // Locations param is defined as a list of points defined relatve to main board
  // ocrPosition defines the position of the ocr polling matrix within the bounding box
  private calibrateOCRRelativeToBoard(image: Pixels, type: OCRType, locations: Point[], ocrPosition: OCRPosition) {

    // floodfill for next box to get nextOCRBox
    const floodfill = new FloodFill(image.width, image.height);
    locations.forEach((loc) => {
      const canvasPosition = this.getOCRBox(OCRType.BOARD)!.getCanvasPositionFromRelative(loc);
      floodfill.floodfill(image, canvasPosition.x, canvasPosition.y, this.floodfillCondition.bind(this));
    });
    const floodfillRect = floodfill.getBoundingRect();
    if (!floodfillRect) {
      throw new Error("floodfill failed");
    }
    console.log("set", type, floodfillRect);
    this.ocr$[type].next(new OCRBox(floodfillRect, NEXT_OCR_POSITION));

  }


  // when user clicks on a location on canvas, floodfill to determine bounding box for
  // tetris board, and use relative positioning to determine OCR boxes for other elements
  // return whether successful
  calibrateOCRBoxes(image: Pixels, mouseX: number, mouseY: number): boolean {

    try {

      this.calibrateBoardOCR(image, mouseX, mouseY);

      // relative positioning for next box from board
      const NEXTBOX_LOCATIONS = [
        {x: 1.5, y: 0.41}, // top of the next box
        {x: 1.5, y: 0.595} // bottom of the next box
      ];
      this.calibrateOCRRelativeToBoard(image, OCRType.NEXT, NEXTBOX_LOCATIONS, NEXT_OCR_POSITION);

      // calibrate text boxes
      this.textBoxes$[TextboxType.LEVEL].next(levelFromBoardBox(this.getOCRBox(OCRType.BOARD)!));
      this.textBoxes$[TextboxType.LINES].next(linesFromBoardBox(this.getOCRBox(OCRType.BOARD)!));
      this.textBoxes$[TextboxType.SCORE].next(scoreFromBoardBox(this.getOCRBox(OCRType.BOARD)!));

      // fine tune textboxes
      ALL_TEXTBOX_TYPES.forEach((type) => {
        this.fineTuneTextbox(type, image);
      });

      return true;

    } catch (e: any) {
      console.error(e.message);
      return false;
    }
  }

  getOCRBox$(type: OCRType): Observable<OCRBox | undefined> {
    return this.ocr$[type].asObservable();
  }

  getOCRBox(type: OCRType): OCRBox | undefined {
    return this.ocr$[type].getValue();
  }

  getBoard$(): Observable<TetrisBoard | undefined> {
    return this.board$.asObservable();
  }

  getBoard(): TetrisBoard | undefined {
    return this.board$.getValue();
  }

  getNextBox(): NextBoxOCR | undefined {
    return this.nextBox$.getValue();
  }

  getNextPiece$(): Observable<TetrominoType | undefined> {
    return this.nextType$.asObservable();
  }

  getNextPiece(): TetrominoType | undefined {
    return this.nextType$.getValue();
  }

  getTextbox$(type: TextboxType): Observable<Textbox | undefined> {
    return this.textBoxes$[type].asObservable();
  }

  getTextbox(type: TextboxType): Textbox | undefined {
    return this.textBoxes$[type].getValue();
  }

  setTextbox(type: TextboxType, textbox: Textbox) {
    this.textBoxes$[type].next(textbox);
  }

  getTextboxResult$(type: TextboxType): Observable<TextboxResult | undefined> {
    return this.textBoxResults$[type].asObservable();
  }

  getTextboxResult(type: TextboxType): TextboxResult | undefined {
    return this.textBoxResults$[type].getValue();
  }


  private getColorForMino(level: number, rgbShine: RGBColor, rgbColor: RGBColor): ColorType {
    const hsvShine = rgbToHsv(rgbShine);

    // first, check if v in RSV is greater than BLOCK_SHINE_VALUE_THRESHOLD for blockshine
    // this determines if block exists
    const minoExists = hsvShine.v > this.BLOCK_SHINE_VALUE_THRESHOLD;

    // if mino exists, find matching color
    let color = ColorType.EMPTY;
    if (minoExists) {
      color = classifyColor(level, rgbColor);
    }
    return color;
  }

  executeBoardOCR(image: Pixels, level: number = 18) {
    const boardOCRBox = this.getOCRBox(OCRType.BOARD);
    const boardShineOCRBox = this.getOCRBox(OCRType.BOARD_SHINE);
    if (!boardOCRBox || !boardShineOCRBox) return;

    const colorGrid = boardOCRBox.evaluate(image);
    const shineGrid = boardShineOCRBox.evaluate(image);

    const board = new TetrisBoard();
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        board.setAt(x, y, this.getColorForMino(level, shineGrid.getAt(x, y), colorGrid.getAt(x,y)));
      }
    }

    // emit new computed tetris board
    this.board$.next(board);
  }

  executeNextOCR(image: Pixels) {
    const nextOCRBox = this.getOCRBox(OCRType.NEXT);
    if (!nextOCRBox) return;

    const nextGrid = nextOCRBox.evaluate(image);

    const nextBox = new NextBoxOCR(nextGrid);
    this.nextBox$.next(nextBox);
    this.nextType$.next(nextBox.getMostSimilarPieceType());
  }

  executeTextboxOCR(image: Pixels, type: TextboxType, textbox?: Textbox): TextboxResult | undefined {
    if (!textbox) textbox = this.getTextbox(type);
    if (!textbox) return;

    const digitMatrices = textbox.getDigitMatrices(image);
    const result = this.ocrDigitService.ocrDigits(digitMatrices);
    this.textBoxResults$[type].next(result);
    return result;
  }

  // for a frame, poll all the OCR data from the frame
  executeOCR(image: Pixels) {
    this.executeBoardOCR(image); // poll board
    this.executeNextOCR(image); // poll next piece
    ALL_TEXTBOX_TYPES.forEach((type) => { // poll score, level, lines
      this.executeTextboxOCR(image, type);
    });

  }

  // fine tune the textbox by moving it around a bit and seeing if OCR confidence improves
  fineTuneTextbox(type: TextboxType, pixels: Pixels) {

    const originalBox = this.getTextbox(type)!;
    const result = this.executeTextboxOCR(pixels, type);

    let bestConfidence = result!.confidence;
    let bestBox = originalBox;

    console.log(`Original ${originalBox.x}, ${originalBox.y}: ${result!.confidence} ${result!.value}`);

    for (let x = -4; x <= 4; x+=1) { // try out different x
      for (let y = -4; y <= 4; y+=1) { // try out different y
        for (let w = -1; w <= 1; w+=1) { // try out different width
          for (let h = -1; h <= 1; h+=1) { // try out different height
            const newBox = new Textbox(originalBox.count, originalBox.x + x, originalBox.y + y, originalBox.width + w, originalBox.height + h);
            const confidence = this.executeTextboxOCR(pixels, type, newBox)!.confidence;

            // console.log(`New ${newBox.x}, ${newBox.y}: ${confidence} ${result!.value}`);

            if (confidence > bestConfidence) {
              bestConfidence = confidence;
              bestBox = newBox;
            }
          }
        }
      }
    }

    if (originalBox !== bestBox) this.setTextbox(type, bestBox);

    const result2 = this.executeTextboxOCR(pixels, type);

    console.log(`Best ${bestBox.x}, ${bestBox.y}: ${result2!.confidence} ${result2!.value}`);

  }

}
