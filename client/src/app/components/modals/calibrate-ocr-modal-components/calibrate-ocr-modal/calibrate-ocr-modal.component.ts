import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { VideoCaptureService } from 'client/src/app/services/ocr/video-capture.service';
import { ModalManagerService } from 'client/src/app/services/modal-manager.service';
import { Subscription } from 'rxjs';
import { OcrService } from 'client/src/app/services/ocr/ocr.service';
import { TetrominoType } from 'client/src/app/models/tetris/tetromino-type';

export enum CalibrationStep {
  SELECT_VIDEO_SOURCE = "Select video source",
  LOCATE_TETRIS_BOARD = "Locate tetris board",
  VERIFY_OCR = "Verify OCR",
  ANTI_CHEAT = "Anti-cheat"
}

@Component({
  selector: 'app-calibrate-ocr-modal',
  templateUrl: './calibrate-ocr-modal.component.html',
  styleUrls: ['./calibrate-ocr-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalibrateOcrModalComponent implements OnDestroy, OnInit {

  readonly ButtonColor = ButtonColor;

  readonly CalibrationStep = CalibrationStep;
  readonly ALL_CALIBRATION_STEPS = Object.values(CalibrationStep);

  public stepIndex: number = 0;

  private clickCanvasSubscription!: Subscription;

  get currentStep(): CalibrationStep {
    return this.ALL_CALIBRATION_STEPS[this.stepIndex];
  }

  constructor(
    public videoCapture: VideoCaptureService,
    public ocr: OcrService,
    private modalManager: ModalManagerService
  ) {

    // if on "locate tetris board step", clicking canvas initiates floodfill
    this.clickCanvasSubscription = this.videoCapture.getMouseClick$().subscribe((mouse) => {
      
      if (this.currentStep === CalibrationStep.LOCATE_TETRIS_BOARD) {
        const pixels = this.videoCapture.getPixels();
        if (pixels && mouse) this.ocr.calibrateOCRBoxes(pixels, mouse.x, mouse.y);
      }

    });
  }

  ngOnInit() {

    // if there is already a video source, start capturing immediately
    if (this.videoCapture.hasCaptureSource()) {
      this.videoCapture.startCapture();
    }
  }

  // whether allowed to go to next step of stepper for calibration
  nextAllowed(): boolean {

    switch (this.currentStep) {
      case CalibrationStep.SELECT_VIDEO_SOURCE:
        return this.videoCapture.hasCaptureSource();

      case CalibrationStep.LOCATE_TETRIS_BOARD:
        return this.ocr.getNextPiece() !== undefined && this.ocr.getNextPiece() !== TetrominoType.ERROR_TYPE;

      case CalibrationStep.VERIFY_OCR:
        return true;

      case CalibrationStep.ANTI_CHEAT:
        return true;

      default:
        return false;
    }
  }

  // whether allowed to go to previous step of stepper for calibration
  previousAllowed(): boolean {
    return this.stepIndex > 0;
  }

  isLastStep(): boolean {
    return this.stepIndex === this.ALL_CALIBRATION_STEPS.length - 1;
  }

  // go to next step of stepper for calibration
  next() {
    if (this.nextAllowed()) {

      // if at the last step, finish and hide modal
      if (this.isLastStep()) this.modalManager.hideModal();

      // otherwise, go to next step
      else this.stepIndex++;
    }
  }

  // go to previous step of stepper for calibration
  previous() {
    if (this.previousAllowed()) {
      this.stepIndex--;
    }
  }

  // show a tooltip for next button if not allowed to go to next step
  nextTooltip(): string {

    if (this.nextAllowed()) return "";


    switch (this.currentStep) {
      case CalibrationStep.SELECT_VIDEO_SOURCE:
        return "Video source not set yet";

      case CalibrationStep.LOCATE_TETRIS_BOARD:
        return this.ocr.getBoard() === undefined ? "Tetris board not located yet" : "Valid next piece not detected";

      case CalibrationStep.VERIFY_OCR:
        return "OCR has not been verified yet";

      case CalibrationStep.ANTI_CHEAT:
        return "Complete anti-cheat first";

      default:
        return "";
    }
  }

  async screenCapture() {

    // get screen capture, requesting with 800px width
    const mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: 800,
      }
    });

    this.videoCapture.setCaptureSource(mediaStream);
    this.videoCapture.startCapture();
  }

  ngOnDestroy() {
    this.clickCanvasSubscription.unsubscribe();
    this.videoCapture.stopCapture(); // don't capture when not necessary to save processing time
  }

}
