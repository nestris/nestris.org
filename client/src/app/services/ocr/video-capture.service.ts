import { ElementRef, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Pixels } from 'src/app/services/ocr/pixels';
import { Point } from 'src/app/shared/tetris/point';
import { Calibration } from 'src/app/ocr/util/calibration';
import { calibrate } from 'src/app/ocr/calibration/calibrate';
import { Frame } from 'src/app/ocr/util/frame';
import { OCRFrame } from 'src/app/ocr/state-machine/ocr-frame';
import { FpsTracker } from 'src/app/shared/scripts/fps-tracker';
import { Rectangle } from 'src/app/ocr/util/rectangle';
import { ColorType } from 'src/app/shared/tetris/tetris-board';

export interface FrameWithContext {
  ctx: CanvasRenderingContext2D,
  rawFrame: Frame,
  ocrFrame?: OCRFrame,
}

@Injectable({
  providedIn: 'root'
})
export class VideoCaptureService {

  private renderer: Renderer2;

  videoDevices$ = new BehaviorSubject<(MediaDeviceInfo | null)[]>([]);
  selectedDevice: MediaDeviceInfo | null = null;
  permissionError: string | null = null;

  // we hold a reference to hidden global video and canvas elements from VideoCaptureComponent
  private videoElement!: HTMLVideoElement;
  private canvasElement!: HTMLCanvasElement;

  private defaultCanvasParent!: HTMLElement;
  private currentCanvasParent?: HTMLElement = undefined;

  // the error for why video source failed
  private permissionError$ = new BehaviorSubject<string | null>(null);

  // The calibration, if set
  private calibration?: Calibration;

  // whether capture source is being polled for pixels every frame
  private capturing$ = new BehaviorSubject<boolean>(false);

  // The current captured frame
  private currentFrame$ = new BehaviorSubject<FrameWithContext | null>(null);

  // track fps for polling video
  private fpsTracker?: FpsTracker;

  private hidden: boolean = true;
  private showBoundingBoxes: boolean = false;

  constructor(
    rendererFactory: RendererFactory2,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.canvasElement = this.renderer.createElement('canvas');
  }

  getCurrentFrame(): FrameWithContext | null {
    return this.currentFrame$.getValue();
  }

  /**
   * Get the observable to the current frame, guaranteed to exist
   */
  getCurrentFrame$(): Observable<FrameWithContext | null> {
    return this.currentFrame$.asObservable();;
  }

  public initVideoDevices() {
    this.generateVideoDevicesList();
    navigator.mediaDevices.addEventListener('devicechange', this.generateVideoDevicesList.bind(this));
  }

  generateVideoDevicesList(): void {
    // this.captureFrameService.resetFrame();
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices: (MediaDeviceInfo | null)[] = devices.filter(device => device.kind === 'videoinput');
      videoDevices.unshift(null); // Add a null option to the beginning of the list

      this.videoDevices$.next(videoDevices);
      console.log("Video devices:", videoDevices);
    });
  }

  getVideoDevices$(): Observable<(MediaDeviceInfo | null)[]> {
    return this.videoDevices$.asObservable();
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
    console.log("setCanvasLocation with showBoundingBoxes", showBoundingBoxes)
  }

  getCanvasElement(): HTMLCanvasElement {
    return this.canvasElement;
  }

  // go back to default canvas parent and hide canvas
  resetCanvasLocation() {
    this.moveCanvasToDOM(this.defaultCanvasParent, true);
    this.showBoundingBoxes = false;
    console.log("resetCanvasLocation");
  }

  /**
   * Calibrate all the OCR boxes through floodfilling at the location of the mouse click
   * @param mouse The position of the mouse in frame pixel units
   */
  calibrateOnMouseClick(mouse: Point) {

    const rawFrame = this.getCurrentFrame()?.rawFrame;
    if (!rawFrame) {
      console.log("Cannot calibrate when no frame is set");
      return;
    }

    this.calibration = calibrate(rawFrame, mouse)[0];
  }

  // set the video capture source, whether from screen capture or video source
  // recommended to set media stream with width bounded to 800px to reduce processing time
  async setCaptureSource(mediaStream: MediaStream | null) {


    if (this.videoElement === undefined) {
      throw new Error("video element not set");
    }

    if (mediaStream === null) {
      this.videoElement.srcObject = null;
      this.permissionError$.next(null);
      return;
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


  // subscribe to permission error
  getPermissionError$(): Observable<string | null> {
    return this.permissionError$.asObservable();
  }

  // get the video element itself. useful if wanting to blit the video to another canvas in addition to the internal one
  getVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }

  // Captures a single frame and stores it
  private captureFrame() {

    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    // Draw the video frame onto the canvas. the most expensive operation (~10-15ms)
    ctx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);

    // Get the pixel data from the canvas and emit it
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = new Pixels(imageData.data, canvas.width, canvas.height);

    // If calibration is set, initialize the OCRFrame
    let ocrFrame: OCRFrame | undefined = undefined;
    if (this.calibration) {
      ocrFrame = new OCRFrame(pixels, this.calibration);

      // Draw bounding boxes if flag is set
      if (!this.hidden && this.showBoundingBoxes) this.drawBoundingBoxes(ctx, ocrFrame);
    }

    this.currentFrame$.next({ ctx, rawFrame: pixels, ocrFrame: ocrFrame });

    // Queue capturing the next frame
    requestAnimationFrame(() => this.captureFrame());
  }

  // Start capturing pixels from capture source as fast as possible
  startCapture() {

    // make sure capture source is set
    if (!this.hasCaptureSource()) {
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
    this.fpsTracker = undefined;
  }

  getFPS(): number | undefined {
    return this.fpsTracker?.getFPS();
  }

  // draw bounding boxes on canvas
  drawBoundingBoxes(ctx: CanvasRenderingContext2D, ocrFrame: OCRFrame) {

    this.drawRect(ctx, ocrFrame.calibration.rects.board, "green");
    this.drawRect(ctx, ocrFrame.calibration.rects.next, "green");

    // Draw dots on each cell of the board representing whether there is a mino there
    for (let {x, y, color} of ocrFrame.getBinaryBoard()!.iterateMinos()) {
      const minoColor = (color === ColorType.EMPTY) ? "red" : "green";
      const minoCenter = ocrFrame.boardOCRBox.getMinoCenter({x, y}, true);
      this.drawCircle(ctx, minoCenter.x, minoCenter.y, 2, minoColor);
    }
    
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
