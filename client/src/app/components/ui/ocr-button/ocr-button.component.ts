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
    private readonly modalManager: ModalManagerService,
  ) {}

  onClick() {
    this.modalManager.showModal(ModalType.CALIBRATE_OCR);
  }

}
