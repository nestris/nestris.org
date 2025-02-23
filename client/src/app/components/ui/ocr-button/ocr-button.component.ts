import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export enum OCRState {
  DISCONNECTED = "disconnected",
  CONNECTED = "connected",
}

@Component({
  selector: 'app-ocr-button',
  templateUrl: './ocr-button.component.html',
  styleUrls: ['./ocr-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OcrButtonComponent {
  @Input() state: OCRState = OCRState.DISCONNECTED;

  readonly OCRState = OCRState;

  onClick() {
    if (this.state === OCRState.DISCONNECTED) this.state = OCRState.CONNECTED;
    else this.state = OCRState.DISCONNECTED;
  }

}
