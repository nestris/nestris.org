import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, from, Observable, Subscription } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { OCRFrame } from 'src/app/ocr/state-machine/ocr-frame';
import { ModalManagerService } from 'src/app/services/modal-manager.service';
import { FrameWithContext, VideoCaptureService } from 'src/app/services/ocr/video-capture.service';
import { Platform, PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';


export enum CalibrationStep {
  SELECT_VIDEO_SOURCE = "Select video source",
  LOCATE_TETRIS_BOARD = "Locate tetris board",
  // VERIFY_OCR = "Verify OCR",
  // ANTI_CHEAT = "Anti-cheat"
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

  // We do not poll for level every frame, as that is too computationally expensive. Instead,
  // we poll for level every few frames and cache the result here.
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
    private platformService: PlatformInterfaceService
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

    // start initializing digit classifier
    this.videoCapture.initDigitClassifier();

    // generate list of video sources
    this.videoCapture.generateVideoDevicesList();

    // if there is already a video source, start capturing immediately
    if (this.videoCapture.hasCaptureSource()) {
      this.videoCapture.startCapture();
    }
  }

  // whether allowed to go to next step of stepper for calibration
  // returns true if allowed, or a string tooltip if not allowed
  nextAllowed(): true | string {

    switch (this.currentStep) {
      case CalibrationStep.SELECT_VIDEO_SOURCE:

        if (!this.videoCapture.hasCaptureSource()) return "Video source not set";

        return true;

      case CalibrationStep.LOCATE_TETRIS_BOARD:

        const ocrFrame = this.videoCapture.getCurrentFrame()?.ocrFrame;
        if (!ocrFrame) return "Invalid video frame";

        const nextPiece = ocrFrame.getNextType();
        if (nextPiece === undefined || nextPiece === TetrominoType.ERROR_TYPE) return "Valid next piece not detected";

        const level = this.ocrLevel$.getValue();
        if (level === undefined || level === -1) return "Valid level not detected";

        return true;

      // case CalibrationStep.VERIFY_OCR:
      //   return true;

      // case CalibrationStep.ANTI_CHEAT:
      //   return true;
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

      // if at the last step, mark as valid, switch to this platform, and hide modal
      if (this.isLastStep()) {
        this.videoCapture.setCalibrationValid(true);
        this.platformService.setPlatform(Platform.OCR);
        this.modalManager.hideModal();
      }

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

      // wait a short time before allowing another level computation
      setTimeout(() => {
        this.computingLevel = false;
      }, 300);
    });
  }

  ngOnDestroy() {
    console.log("calibrate ocr model ondestroy");
    this.videoCapture.stopCapture(); // don't capture when not necessary to save processing time
    this.frameUpdateSubscription?.unsubscribe();
  }

}
