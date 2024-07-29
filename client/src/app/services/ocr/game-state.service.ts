import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Pixels } from 'src/app/models/ocr/pixels';
import { FpsTracker } from 'src/app/shared/scripts/fps-tracker';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';
import { PlatformInterfaceService, PolledGameData } from '../platform-interface.service';
import { OcrService, TextboxType } from './ocr.service';
import { VideoCaptureService } from './video-capture.service';

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


  // whether capture source is being polled for pixels every frame
  private capturing$ = new BehaviorSubject<boolean>(false);

  // track fps for polling video
  private fpsTracker!: FpsTracker;

  constructor(
    private videoCapture: VideoCaptureService,
    private ocr: OcrService,
    private platform: PlatformInterfaceService
  ) {}

  // if not in game, poll everything
  private onNonGameFrameCapture(pixels: Pixels) {

    let updatedBoard = false;
    let updatedNextPiece = false;
    let updatedStatus = false;

    // polls board, next piece, level, lines, score
    // this is an expensive operation
    this.ocr.executeOCR(pixels); 
      
    // update board, next piece, level, lines, score
    const board = this.ocr.getBoard();
    if (board && !this.board$.getValue().equals(board)) {
      this.board$.next(board);
      updatedBoard = true;
    }

    const nextPiece = this.ocr.getNextPiece();
    if (nextPiece && this.nextPiece$.getValue() !== nextPiece) {
      this.nextPiece$.next(nextPiece);
      updatedNextPiece = true;
    }

    const level = this.ocr.getTextboxResult(TextboxType.LEVEL);
    if (level && this.level$.getValue() !== level.value) {
      this.level$.next(level.value);
      updatedStatus = true;
    }

    const lines = this.ocr.getTextboxResult(TextboxType.LINES);
    if (lines && this.lines$.getValue() !== lines.value) {
      this.lines$.next(lines.value);
      updatedStatus = true;
    }

    const score = this.ocr.getTextboxResult(TextboxType.SCORE);
    if (score && this.score$.getValue() !== score.value) {
      this.score$.next(score.value);
      updatedStatus = true;
    }

    // if any of the textboxes were updated, send updated game data to platform service
    if (updatedBoard || updatedNextPiece || updatedStatus) {
      const data: PolledGameData = {
        board: this.board$.getValue(),
        nextPiece: this.nextPiece$.getValue(),
        level: this.level$.getValue(),
        lines: this.lines$.getValue(),
        score: this.score$.getValue(),
        countdown: undefined // TODO
      };
      this.platform.updateGameData(data);
    }
  }

  // if in game, use careful combination of OCR and derived game state to only poll what is necessary
  // normally, OCR and derived game state should be the same, but need to handle desync cases
  private onGameFrameCapture(pixels: Pixels) {

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
