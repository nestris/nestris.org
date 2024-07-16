import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { Pixels } from 'src/app/models/ocr/pixels';
import { Textbox } from 'src/app/models/ocr/text-box';
import { VideoCaptureService } from 'src/app/services/ocr/video-capture.service';


@Component({
  selector: 'app-textbox-canvas',
  templateUrl: './textbox-canvas.component.html',
  styleUrls: ['./textbox-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextboxCanvasComponent implements OnChanges {
  @ViewChild('textboxCanvasElement') canvas?: ElementRef<HTMLCanvasElement>;

  @Input() textbox!: Textbox;
  @Input() size: number = 8;
  
  @Input() pixels?: Pixels | null;

  constructor(
    private videoCapture: VideoCaptureService,
  ) {}

  // on change of pixels, print hello
  ngOnChanges(): void {

    if (!this.pixels || !this.canvas) {
      return;
    }

    const canvasContext = this.canvas.nativeElement.getContext('2d');
    if (!canvasContext) {
      return;
    }

    // console.log('hello');

    // Set the main canvas size to the target WIDTH and HEIGHT
    this.canvas.nativeElement.width = this.size * this.textbox.count;
    this.canvas.nativeElement.height = this.size;

    const drawnCanvas = this.videoCapture.getCanvasElement();

    // Now draw only the part of the offscreen canvas defined by the textbox to the main canvas
    // This step automatically handles resizing
    canvasContext.drawImage(
      drawnCanvas,
      this.textbox.x, this.textbox.y, this.textbox.width, this.textbox.height,  // Source rectangle
      0, 0, this.size * this.textbox.count, this.size // Destination rectangle in the main canvas
    );
    
  }


}
