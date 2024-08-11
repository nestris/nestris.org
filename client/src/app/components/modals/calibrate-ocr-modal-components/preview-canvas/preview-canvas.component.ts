import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { VideoCaptureService } from 'src/app/services/ocr/video-capture.service';

@Component({
  selector: 'app-preview-canvas',
  templateUrl: './preview-canvas.component.html',
  styleUrls: ['./preview-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasParentElement') canvasParentElement!: ElementRef<HTMLElement>;

  // whether to display the bounding boxes of the different OCR elements, if they exist
  @Input() showBoundingBoxes: boolean = false;

  private isMouseOnVideo: boolean = false;
  private mouseX: number = 0;
  private mouseY: number = 0;

  readonly CANVAS_WIDTH = 400;
  readonly CANVAS_HEIGHT = 300;

  private mouseClickListener: Function | null = null;

  constructor(
    private videoCapture: VideoCaptureService,
    private renderer: Renderer2
  ) {
    this.mouseClickListener = this.renderer.listen('document', 'click', this.onMouseClick.bind(this));

  }

  // on construction, move canvas from default parent to preview canvas parent
  ngAfterViewInit(): void {
    this.videoCapture.setCanvasLocation(this.canvasParentElement, this.CANVAS_WIDTH, this.CANVAS_HEIGHT, this.showBoundingBoxes);
  }

  // on destruction, move canvas back to default parent and hide it
  ngOnDestroy(): void {
    this.videoCapture.resetCanvasLocation();
    // remove listener
    if (this.mouseClickListener) {
      this.mouseClickListener();
      this.mouseClickListener = null;
    }
  }

  onMouseEnter(): void {
    this.isMouseOnVideo = true;
  }

  onMouseLeave(): void {
    this.isMouseOnVideo = false;
  }

  public onMouseMove(event: MouseEvent): void {
    const rect = this.canvasParentElement.nativeElement.getBoundingClientRect();
    const CANVAS_RESOLUTION_SCALE_X = this.videoCapture.getCanvasElement().width / this.CANVAS_WIDTH;
    const CANVAS_RESOLUTION_SCALE_Y = this.videoCapture.getCanvasElement().height / this.CANVAS_HEIGHT;
    this.mouseX = Math.round((event.clientX - rect.left) * CANVAS_RESOLUTION_SCALE_X);
    this.mouseY = Math.round((event.clientY - rect.top) * CANVAS_RESOLUTION_SCALE_Y);

  }

  private onMouseClick(): void {
    if (this.isMouseOnVideo) {
      this.videoCapture.calibrateOnMouseClick({x : this.mouseX, y : this.mouseY});
    }
  }



}
