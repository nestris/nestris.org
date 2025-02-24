import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';

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

  constructor(
    private readonly modalManager: ModalManagerService
  ) {}

  onClick() {
    //if (this.state === OCRState.DISCONNECTED) this.state = OCRState.CONNECTED;
    //else this.state = OCRState.DISCONNECTED;

    if (this.state === OCRState.DISCONNECTED) {
      this.modalManager.showModal(ModalType.CALIBRATE_OCR);
    }

  }

}
