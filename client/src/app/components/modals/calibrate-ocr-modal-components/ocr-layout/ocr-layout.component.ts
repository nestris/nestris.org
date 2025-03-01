import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FrameWithContext } from 'src/app/services/ocr/video-capture.service';
import { OCRFrameData } from '../calibrate-ocr-modal/calibrate-ocr-modal.component';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';

@Component({
  selector: 'app-ocr-layout',
  templateUrl: './ocr-layout.component.html',
  styleUrls: ['./ocr-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OcrLayoutComponent {
  @Input() frameWithContext: FrameWithContext | null | undefined = null;
  @Input() ocrFrameData: OCRFrameData | null | undefined = undefined;
  @Input() error: string = "An error occured";

  readonly TetrominoType = TetrominoType;
}
