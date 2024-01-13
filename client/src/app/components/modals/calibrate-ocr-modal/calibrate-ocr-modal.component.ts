import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-calibrate-ocr-modal',
  templateUrl: './calibrate-ocr-modal.component.html',
  styleUrls: ['./calibrate-ocr-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalibrateOcrModalComponent {

  public steps: string[] = [
    "Select video source",
    "Locate tetris board",
    "Verify OCR",
    "Anti-cheat"
  ];

  public activeStep: number = 0;
}
