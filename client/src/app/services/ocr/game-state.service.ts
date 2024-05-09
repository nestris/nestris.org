import { Injectable } from '@angular/core';
import { TetrisBoard } from 'network-protocol/tetris/tetris-board';
import { TetrominoType } from 'network-protocol/tetris/tetromino-type';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { VideoCaptureService } from './video-capture.service';
import { ALL_TEXTBOX_TYPES, OcrService, TextboxType } from './ocr.service';
import { Pixels } from '../../models/ocr/pixels';
import { FpsTracker } from 'misc/fps-tracker';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {

  /*
  Game state is derived differently depending on whether a game is in progress.
  During a game, text ocr is only polled after each line clear.
  And, next piece is only polled after a piece is spawned.

  However, when a game is not in progress, everything is polled every frame.

  */
  private isInGame$ = new BehaviorSubject<boolean>(false);

  private board$ = new BehaviorSubject<TetrisBoard>(new TetrisBoard());
  private nextPiece$ = new BehaviorSubject<TetrominoType>(TetrominoType.ERROR_TYPE);
  private level$ = new BehaviorSubject<number>(18);
  private lines$ = new BehaviorSubject<number>(0);
  private score$ = new BehaviorSubject<number>(0);
  private trt$ = new BehaviorSubject<number>(0);

  private onUpdate$ = new Subject<void>();

  // whether capture source is being polled for pixels every frame
  private capturing$ = new BehaviorSubject<boolean>(false);

  // track fps for polling video
  private fpsTracker!: FpsTracker;

  constructor(
    private videoCapture: VideoCaptureService,
    private ocr: OcrService,
  ) {}

  // if not in game, poll everything
  private onNonGameFrameCapture(pixels: Pixels) {

    let updated = false;

    this.ocr.executeOCR(pixels); // polls board, next piece, level, lines, score
      
    // update board, next piece, level, lines, score
    const board = this.ocr.getBoard();
    if (board) {
      this.board$.next(board);
      updated = true;
      console.log("updated board");
    }

    const nextPiece = this.ocr.getNextPiece();
    if (nextPiece) {
      this.nextPiece$.next(nextPiece);
      updated = true;
      console.log("updated next piece");
    }

    const level = this.ocr.getTextboxResult(TextboxType.LEVEL);
    if (level) {
      this.level$.next(level.value);
      updated = true;
      console.log("updated level");
    }

    const lines = this.ocr.getTextboxResult(TextboxType.LINES);
    if (lines) {
      this.lines$.next(lines.value);
      updated = true;
      console.log("updated lines");
    }

    const score = this.ocr.getTextboxResult(TextboxType.SCORE);
    if (score) {
      this.score$.next(score.value);
      updated = true;
      console.log("updated score");
    }

    // if any of the textboxes were updated, emit an update
    if (updated) this.onUpdate$.next();
  }

  // if in game, use careful combination of OCR and derived game state to only poll what is necessary
  // normally, OCR and derived game state should be the same, but need to handle desync cases
  private onGameFrameCapture(pixels: Pixels) {

  }

  getOnUpdate$(): Observable<void> {
    return this.onUpdate$.asObservable();
  }

  getBoard$(): Observable<TetrisBoard> {
    return this.board$.asObservable();
  }

  getBoard(): TetrisBoard {
    return this.board$.getValue();
  }

  getNextPiece$(): Observable<TetrominoType> {
    return this.nextPiece$.asObservable();
  }

  getNextPiece(): TetrominoType {
    return this.nextPiece$.getValue();
  }

  getLevel$(): Observable<number> {
    return this.level$.asObservable();
  }

  getLevel(): number {
    return this.level$.getValue();
  }

  getLines$(): Observable<number> {
    return this.lines$.asObservable();
  }

  getLines(): number {
    return this.lines$.getValue();
  }

  getScore$(): Observable<number> {
    return this.score$.asObservable();
  }

  getScore(): number {
    return this.score$.getValue();
  }

  getTrt$(): Observable<number> {
    return this.trt$.asObservable();
  }

  getTrt(): number {
    return this.trt$.getValue();
  }

  isCapturing(): boolean {
    return this.capturing$.getValue();
  }

  isCapturing$(): Observable<boolean> {
    return this.capturing$.asObservable();
  }

  // start capturing pixels from capture source as fast as possible
  startCapture() {

    // make sure capture source is set
    if (!this.videoCapture.hasCaptureSource()) {
      throw new Error("capture source not set");
    }

    if (this.capturing$.getValue()) return;

    this.capturing$.next(true);
    this.fpsTracker = new FpsTracker();

    // start capturing
    console.log("starting capture");
    this.captureFrame();
  }

  // stop capturing pixels from capture source.
  // sets the capturing flag to false, which will terminate the captureFrame() loop on the start of the next frame
  stopCapture() {
    console.log("stopping capture");
    this.capturing$.next(false);
  }

  // get fps of video capture polling loop. undefined if not capturing
  getFPS(): number | undefined {
    return this.fpsTracker?.getFPS();
  }

  private captureFrame() {

    if (!this.capturing$.getValue()) return; // stop capturing if we're not supposed to be capturing

    // get poll pixels from video/screen capture
    const { ctx, pixels } = this.videoCapture.pollPixels();

    // run OCR if pixels are available
    if (pixels) this.isInGame$.getValue() ? this.onGameFrameCapture(pixels) : this.onNonGameFrameCapture(pixels);

    // draw bounding boxes if enabled
    if (ctx) this.videoCapture.drawBoundingBoxes(ctx);

    // calculate fps
    this.fpsTracker.tick();

    requestAnimationFrame(() => this.captureFrame());
  }

}
