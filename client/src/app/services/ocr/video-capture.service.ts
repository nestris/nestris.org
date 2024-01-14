import { ElementRef, Injectable } from '@angular/core';
import { FpsTracker } from 'misc/fps-tracker';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoCaptureService {

  private videoElement!: ElementRef<HTMLVideoElement>;
  private canvasElement!: ElementRef<HTMLCanvasElement>;

  private capturing: boolean = false;

  private permissionError$ = new BehaviorSubject<string | null>(null);

  // observable for pixels of video capture source. updated every frame
  private pixels$ = new BehaviorSubject<Uint8ClampedArray | null>(null);

  // track fps for polling video
  private fpsTracker!: FpsTracker;
   

  constructor() {}

  initVideoCapture(videoElement: ElementRef<HTMLVideoElement>, canvasElement: ElementRef<HTMLCanvasElement>): void {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
  }

  async setCaptureSource(mediaStream: MediaStream) {

    try {
      this.videoElement.nativeElement.srcObject = mediaStream;
      this.permissionError$.next(null); // Clear any previous error

      // set canvas to video resolution
      const videoTrack = mediaStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      this.canvasElement.nativeElement.width = settings.width!;
      this.canvasElement.nativeElement.height = settings.height!;
      
      console.log("set media stream with video resolution", settings.width, settings.height);

    } catch (err) {
      this.permissionError$.next((err as Error).message);
    };
  }

  hasCaptureSource(): boolean {
    return this.videoElement.nativeElement.srcObject !== null;
  }

  startCapture() {

    // make sure capture source is set
    if (!this.hasCaptureSource()) {
      throw new Error("capture source not set");
    }

    this.capturing = true;
    this.fpsTracker = new FpsTracker();

    // start capturing
    this.captureFrame();
  }

  stopCapture() {
    this.capturing = false;
  }

  getFPS(): number | undefined {
    return this.fpsTracker?.getFPS();
  }

  getPermissionError$(): Observable<string | null> {
    return this.permissionError$.asObservable();
  }

  getPixels$(): Observable<Uint8ClampedArray | null> {
    return this.pixels$.asObservable();
  }

  getVideoElement(): HTMLVideoElement {
    return this.videoElement.nativeElement;
  }

  private captureFrame() {
    if (!this.capturing) return; // stop capturing if we're not supposed to be capturing

    // calculate fps
    this.fpsTracker.tick();

    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    // Draw the video frame onto the canvas. the most expensive operation (~10-15ms)
    ctx.drawImage(this.videoElement.nativeElement, 0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);

    // Get the pixel data from the canvas and emit it
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.pixels$.next(imageData.data);

    requestAnimationFrame(() => this.captureFrame());
  }

}
