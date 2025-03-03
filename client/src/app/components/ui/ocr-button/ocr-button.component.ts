import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { Platform } from 'src/app/shared/models/platform';

export enum OCRState {
  OFF = "off",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
}

@Component({
  selector: 'app-ocr-button',
  templateUrl: './ocr-button.component.html',
  styleUrls: ['./ocr-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OcrButtonComponent implements OnChanges {
  @Input() platform!: Platform;
  @Input() connected!: boolean;
  @Input() expanded: boolean = true;

  state: OCRState = OCRState.OFF;

  readonly OCRState = OCRState;

  constructor(
    private readonly modalManager: ModalManagerService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['platform'] || changes['connected']) {
      if (this.platform === Platform.ONLINE) this.state = OCRState.OFF;
      else this.state = this.connected ? OCRState.CONNECTED : OCRState.DISCONNECTED;
    }
  }

  onClick() {
    this.modalManager.showModal(ModalType.CALIBRATE_OCR);
  }

}
