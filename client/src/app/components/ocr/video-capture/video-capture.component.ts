import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { VideoCaptureService } from 'src/app/services/ocr/video-capture.service';

@Component({
  selector: 'app-video-capture',
  templateUrl: './video-capture.component.html',
  styleUrls: ['./video-capture.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoCaptureComponent implements AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasParentElement') canvasParentElement!: ElementRef<HTMLElement>;

  constructor(private service: VideoCaptureService) {}

  ngAfterViewInit(): void {
      this.service.initVideoCapture(this.videoElement, this.canvasParentElement);
  }
}
