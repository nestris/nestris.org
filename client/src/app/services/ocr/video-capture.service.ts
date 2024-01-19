import { ElementRef, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { FpsTracker } from 'misc/fps-tracker';
import { BehaviorSubject, Observable } from 'rxjs';
import { Pixels } from '../../models/ocr/pixels';
import { OCRBox, Rectangle } from '../../models/ocr/ocr-box';
import { OCRType, OcrService } from './ocr.service';
import { Point } from '../../models/point';
import { TetrisBoard } from '../../models/tetris/tetris-board';

@Injectable({
  providedIn: 'root'
})
export class VideoCaptureService {

  private renderer: Renderer2;

  // we hold a reference to hidden global video and canvas elements from VideoCaptureComponent
  private videoElement!: HTMLVideoElement;
  private canvasElement!: HTMLCanvasElement;

  private defaultCanvasParent!: HTMLElement;
  private currentCanvasParent?: HTMLElement = undefined;

  private hidden: boolean = true;
  private showBoundingBoxes: boolean = false;

  // whether capture source is being polled for pixels every frame
  // this is an expensive task
  private capturing: boolean = false;

  // the error for why video source failed
  private permissionError$ = new BehaviorSubject<string | null>(null);

  // observable for pixels of video capture source. updated every frame
  private pixels$ = new BehaviorSubject<Pixels | null>(null);

  // track fps for polling video
  private fpsTracker!: FpsTracker;

  // subject for location of mouse when clicking on canvas
  private mouseClick$ = new BehaviorSubject<{ x: number, y: number } | null>(null);
   

  constructor(
    rendererFactory: RendererFactory2,
    private ocrService: OcrService,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.canvasElement = this.renderer.createElement('canvas');
  }

  private moveCanvasToDOM(parentElement: HTMLElement, hidden: boolean) {
    if (this.currentCanvasParent) {
      this.renderer.removeChild(this.currentCanvasParent, this.canvasElement);
    }
    this.renderer.appendChild(parentElement, this.canvasElement);
    this.renderer.setStyle(this.canvasElement, 'display', hidden ? 'none' : 'block');

    this.hidden = hidden;
  }

  // must be called when VideoCaptureComponent is initialized to set the video and canvas elements
  initVideoCapture(videoElement: ElementRef<HTMLVideoElement>, defaultCanvasParent: ElementRef<HTMLElement>): void {
    this.videoElement = videoElement.nativeElement;
    this.defaultCanvasParent = defaultCanvasParent.nativeElement;
    this.resetCanvasLocation();
  }

  // move canvas to a different parent element and make it visible
  setCanvasLocation(parentElement: ElementRef<HTMLElement>, displayWidth: number, displayHeight: number, showBoundingBoxes: boolean = false) {
    this.moveCanvasToDOM(parentElement.nativeElement, false);
    this.canvasElement.style.width = displayWidth + 'px';
    this.canvasElement.style.height = displayHeight + 'px';
    this.showBoundingBoxes = showBoundingBoxes;
  }

  getCanvasElement(): HTMLCanvasElement {
    return this.canvasElement;
  }

  // only called by preview canvas component
  _onMouseClick(x: number, y: number) {
    this.mouseClick$.next({ x: Math.floor(x), y: Math.floor(y) });
  }

  // subscribe to this to get mouse click events on canvas
  getMouseClick$(): Observable<{ x: number, y: number } | null> {
    return this.mouseClick$.asObservable();
  }

  // go back to default canvas parent and hide canvas
  resetCanvasLocation() {
    this.moveCanvasToDOM(this.defaultCanvasParent, true);
    this.showBoundingBoxes = false;
  }

  // set the video capture source, whether from screen capture or video source
  // recommended to set media stream with width bounded to 800px to reduce processing time
  async setCaptureSource(mediaStream: MediaStream) {


    if (this.videoElement === undefined) {
      throw new Error("video element not set");
    }

    try {
      this.videoElement.srcObject = mediaStream;
      this.permissionError$.next(null); // Clear any previous error

      // set canvas to video resolution
      const videoTrack = mediaStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      this.canvasElement.width = settings.width!;
      this.canvasElement.height = settings.height!;

      console.log("set media stream with video resolution", settings.width, settings.height);

    } catch (err) {
      this.permissionError$.next((err as Error).message);
    };
  }

  // whether a capture source has been set through setCaptureSource()
  hasCaptureSource(): boolean {
    const captureSource = this.videoElement.srcObject;
    return captureSource !== null && captureSource !== undefined;
  }

  // start capturing pixels from capture source as fast as possible
  startCapture() {

    // make sure capture source is set
    if (!this.hasCaptureSource()) {
      throw new Error("capture source not set");
    }

    if (this.capturing) return;

    this.capturing = true;
    this.fpsTracker = new FpsTracker();

    // start capturing
    console.log("starting capture");
    this.captureFrame();
  }

  // stop capturing pixels from capture source.
  // sets the capturing flag to false, which will terminate the captureFrame() loop on the start of the next frame
  stopCapture() {
    console.log("stopping capture");
    this.capturing = false;
  }

  // get fps of video capture polling loop. undefined if not capturing
  getFPS(): number | undefined {
    return this.fpsTracker?.getFPS();
  }

  // subscribe to permission error
  getPermissionError$(): Observable<string | null> {
    return this.permissionError$.asObservable();
  }

  // subscribe to pixels of last polled video frame
  getPixels$(): Observable<Pixels | null> {
    return this.pixels$.asObservable();
  }

  getPixels(): Pixels | null {
    return this.pixels$.getValue();
  }

  // get the video element itself. useful if wanting to blit the video to another canvas in addition to the internal one
  getVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }

  // polls the video capture source for pixels and emits them.
  // calls itself recursively
  private captureFrame() {
    if (!this.capturing) return; // stop capturing if we're not supposed to be capturing

    // calculate fps
    this.fpsTracker.tick();

    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    // Draw the video frame onto the canvas. the most expensive operation (~10-15ms)
    ctx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);

    // Get the pixel data from the canvas and emit it
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.pixels$.next(new Pixels(imageData.data, canvas.width, canvas.height));

    // perform ocr for board and other elements
    this.ocrService.executeOCR(this.getPixels()!);

    // draw bounding boxes if enabled
    if (!this.hidden && this.showBoundingBoxes) {
      this.drawBoundingBoxes(ctx);
    }

    requestAnimationFrame(() => this.captureFrame());
  }

  // draw bounding boxes on canvas
  private drawBoundingBoxes(ctx: CanvasRenderingContext2D) {

    this.drawOCROverlay(ctx, this.ocrService.getOCRBox(OCRType.BOARD));
    this.drawOCROverlay(ctx, this.ocrService.getOCRBox(OCRType.BOARD_SHINE))

  }

  // draw the bounding box of an OCRBox onto the canvas
  private drawOCROverlay(ctx: CanvasRenderingContext2D, ocr?: OCRBox): void {

    if (!ocr) return;

    // draw board rect
    this.drawRect(ctx, ocr.getBoundingRect(), "rgb(0, 255, 0)");

    // draw OCR positions
    this.drawOCRPositions(ctx, ocr.getPositions(), this.ocrService.getBoard());
  }

  // draw a rectangle given a rectangle, with border just outside of rectangle bounds
  private drawRect(ctx: CanvasRenderingContext2D, boardRect: Rectangle, color: string): void {
    ctx.strokeStyle = color;

    // draw border so that the border is outside the rect
    const BORDER_WIDTH = 2;
    ctx.lineWidth = BORDER_WIDTH;
    ctx.strokeRect(
      boardRect.left - BORDER_WIDTH,
      boardRect.top - BORDER_WIDTH,
      boardRect.right - boardRect.left + BORDER_WIDTH*2,
      boardRect.bottom - boardRect.top + BORDER_WIDTH*2);
  }

  // draw a dot for each OCR position
  private drawOCRPositions(ctx: CanvasRenderingContext2D, positions: Point[][], board?: TetrisBoard) {

    for (let yIndex = 0; yIndex < positions.length; yIndex++) {
      for (let xIndex = 0; xIndex < positions[yIndex].length; xIndex++) {
        const {x,y} = positions[yIndex][xIndex];
        const isMino = board?.exists(xIndex, yIndex) ?? false;
        const color = isMino ? "rgb(0,255,0)" : "rgb(255,0,0)";
        this.drawCircle(ctx, x, y, 2, color);
      }
    }
  }

  // example: drawCircle(ctx, 50, 50, 25, 'black', 'red', 2)
  private drawCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    fill?: string | CanvasGradient | CanvasPattern,
    stroke?: string | CanvasGradient | CanvasPattern,
    strokeWidth?: number
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.lineWidth = strokeWidth || 1; // Default to 1 if strokeWidth is not provided
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

}
