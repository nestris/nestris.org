import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, from, Observable, Subscription } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { OCRFrame } from 'src/app/ocr/state-machine/ocr-frame';
import { ModalManagerService } from 'src/app/services/modal-manager.service';
import { FrameWithContext, VideoCaptureService } from 'src/app/services/ocr/video-capture.service';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';


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

  ocrLevel$ = new BehaviorSubject<number | undefined>(undefined);

  public stepIndex: number = 0;

  frameUpdateSubscription: Subscription | undefined;
  private computingLevel = false;

  get currentStep(): CalibrationStep {
    return this.ALL_CALIBRATION_STEPS[this.stepIndex];
  }

  constructor(
    public videoCapture: VideoCaptureService,
    private modalManager: ModalManagerService,
  ) {

    // subscribe to frame updates to get level
    this.frameUpdateSubscription = this.videoCapture.getCurrentFrame$().subscribe(
      (frame: FrameWithContext | null) => {
        if (frame?.ocrFrame) this.onFrameUpdate(frame.ocrFrame);
      }
    );

  }

  ngOnInit() {

    console.log("calibrate ocr model oninit");

    // generate list of video sources
    this.videoCapture.generateVideoDevicesList();

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
        const nextPiece = this.videoCapture.getCurrentFrame()?.ocrFrame?.getNextType();
        return nextPiece !== undefined && nextPiece !== TetrominoType.ERROR_TYPE;

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
        const board = this.videoCapture.getCurrentFrame()?.ocrFrame?.getBinaryBoard();
        return board === undefined ? "Tetris board not located yet" : "Valid next piece not detected";

      case CalibrationStep.VERIFY_OCR:
        return "OCR has not been verified yet";

      case CalibrationStep.ANTI_CHEAT:
        return "Complete anti-cheat first";

      default:
        return "";
    }
  }

  async setScreenCapture() {

    // get screen capture, requesting with 1000px width
    const mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: 1200,
      }
    });

    this.videoCapture.setCaptureSource(mediaStream);
    this.videoCapture.startCapture();

    // Go to next step
    this.next();
  }

  async setVideoCapture() {

    // fetch the selected device in dropdown
    const selectedDevice = this.videoCapture.selectedDevice;

    // if no device selected, stop capture
    if (!selectedDevice) {
      this.videoCapture.setCaptureSource(null);
      this.videoCapture.stopCapture();
      return;
    }

    // get video stream from selected device
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: selectedDevice.deviceId,
        width: 1200,
      }
    });

    this.videoCapture.setCaptureSource(mediaStream);
    this.videoCapture.startCapture();

    // Go to next step
    this.next();
  }

  // Compute level only when not already computing
  onFrameUpdate(frame: OCRFrame) {
    if (this.computingLevel) return;
    this.computingLevel = true;
    frame.getLevel().then(level => {
      this.ocrLevel$.next(level);

      // wait 1 second before allowing another level computation
      setTimeout(() => {
        this.computingLevel = false;
      }, 1000);
    });
  }

  ngOnDestroy() {
    console.log("calibrate ocr model ondestroy");
    this.videoCapture.stopCapture(); // don't capture when not necessary to save processing time
    this.frameUpdateSubscription?.unsubscribe();
  }

}
