import { Injectable } from '@angular/core';
import { VideoCaptureService } from './video-capture.service';
import { BOARD_OCR_POSITION, BOARD_SHINE_OCR_POSITION, OCRBox } from '../../models/ocr/ocr-box';
import { Pixels } from '../../models/ocr/pixels';
import { FloodFill } from '../../models/ocr/floodfill';
import { RGBColor, rgbToHsv } from '../../scripts/color';
import { BehaviorSubject, Observable } from 'rxjs';
import { ColorType, TetrisBoard } from '../../models/tetris/tetris-board';
import { classifyColor } from '../../models/tetris/tetromino-colors';

/*
Service to poll current video capture frame for different OCR results
Since you might not need all the OCR data every frame, poll only what's needed
*/

export enum OCRType {
  BOARD = "BOARD",
  BOARD_SHINE = "BOARD_SHINE",
}

@Injectable({
  providedIn: 'root'
})
export class OcrService {

  private readonly BLOCK_SHINE_VALUE_THRESHOLD = 10;

  private ocr$ = {
    [OCRType.BOARD]: new BehaviorSubject<OCRBox | undefined>(undefined),
    [OCRType.BOARD_SHINE]: new BehaviorSubject<OCRBox | undefined>(undefined),
  }

  private board$ = new BehaviorSubject<TetrisBoard | undefined>(undefined);


  // if each varies by less than 30, then they are similar
  private floodfillCondition(colorA: RGBColor, colorB: RGBColor): boolean {
    return Math.abs(colorA.r - colorB.r) < 30 &&
      Math.abs(colorA.g - colorB.g) < 30 &&
      Math.abs(colorA.b - colorB.b) < 30;
  }

  // when user clicks on a location on canvas, floodfill to determine bounding box for
  // tetris board, and use relative positioning to determine OCR boxes for other elements
  // return whether successful
  calibrateOCRBoxes(image: Pixels, mouseX: number, mouseY: number): boolean {
  
    // floodfill for tetris board to get boardOCRBox
    let floodfill = new FloodFill(image.width, image.height);
    floodfill.floodfill(image, mouseX, mouseY, this.floodfillCondition.bind(this));
    const floodfillRect = floodfill.getBoundingRect();
    if (!floodfillRect) {
      console.error('floodfill failed');
      return false;
    }
    console.log("set boardOCRBox", floodfillRect);
    this.ocr$[OCRType.BOARD].next(new OCRBox(floodfillRect, BOARD_OCR_POSITION));
    this.ocr$[OCRType.BOARD_SHINE].next(new OCRBox(floodfillRect, BOARD_SHINE_OCR_POSITION));

    return true;
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

  private executeBoardOCR(image: Pixels, level: number = 18) {
    const boardOCRBox = this.getOCRBox(OCRType.BOARD);
    const boardShineOCRBox = this.getOCRBox(OCRType.BOARD_SHINE);
    if (!boardOCRBox || !boardShineOCRBox) return;

    const colorGrid = boardOCRBox.evaluate(image);
    const shineGrid = boardShineOCRBox.evaluate(image);

    const board = new TetrisBoard();
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {

        const rgbShine = shineGrid.getAt(x, y);
        const hsvShine = rgbToHsv(rgbShine);

        // first, check if v in RSV is greater than BLOCK_SHINE_VALUE_THRESHOLD for blockshine
        // this determines if block exists
        const minoExists = hsvShine.v > this.BLOCK_SHINE_VALUE_THRESHOLD;

        // if mino exists, find matching color
        let color = ColorType.EMPTY;
        if (minoExists) {
          const rgbColor = colorGrid.getAt(x,y);
          color = classifyColor(level, rgbColor);
        }

        board.setAt(x, y, color);
      }
    }

    // emit new computed tetris board
    this.board$.next(board);

  }

  // for a frame, extract all the OCR data from the frame
  executeOCR(image: Pixels) {
    this.executeBoardOCR(image);
  }

}
