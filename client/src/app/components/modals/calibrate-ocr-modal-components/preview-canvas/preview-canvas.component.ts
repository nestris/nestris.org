import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { VideoCaptureService } from 'client/src/app/services/ocr/video-capture.service';

@Component({
  selector: 'app-preview-canvas',
  templateUrl: './preview-canvas.component.html',
  styleUrls: ['./preview-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasParentElement') canvasParentElement!: ElementRef<HTMLElement>;

  constructor(
    private videoCapture: VideoCaptureService
  ) {}

  // on construction, move canvas from default parent to preview canvas parent
  ngAfterViewInit(): void {
    this.videoCapture.setCanvasLocation(this.canvasParentElement, 400, 300);
  }

  // on destruction, move canvas back to default parent and hide it
  ngOnDestroy(): void {
    this.videoCapture.resetCanvasLocation();
  }



}
