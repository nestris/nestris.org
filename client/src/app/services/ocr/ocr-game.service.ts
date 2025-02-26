import { Injectable } from '@angular/core';
import { VideoCaptureService } from './video-capture.service';
import { OCRConfig, OCRStateMachine } from 'src/app/ocr/state-machine/ocr-state-machine';
import { PlatformInterfaceService } from '../platform-interface.service';
import { OCRStateID } from 'src/app/ocr/state-machine/ocr-states/ocr-state-id';

@Injectable({
  providedIn: 'root'
})
export class OcrGameService {

  private stateMachine?: OCRStateMachine;

  constructor(
    private videoCapture: VideoCaptureService,
    private platform: PlatformInterfaceService
  ) {

    // Register a subscriber to the video capture service for processing video frames
    this.videoCapture.registerSubscriber(async (frame) => {
      if (!this.stateMachine) return;
      if (!frame || !frame.ocrFrame) return;
      
      // Every time a new video frame is captured, advance state machine and send display data
      // to PlatformInterfaceService
      await this.stateMachine.advanceFrame(frame.ocrFrame);
      const displayData = this.stateMachine.getGameDisplayData();
      this.platform.updateGameData(displayData);
    })
  }

  /**
   * Start polling video and performing OCR for exactly one game. If the level is specified, the level
   * must match for the game to start
   * @param config Configuration parameters for the OCR state machine
   */
  startGameCapture(config: OCRConfig) {

    if (this.stateMachine) {
      console.error("Game already started");
      return;
    }

    this.stateMachine = new OCRStateMachine(config, this.platform);
    this.videoCapture.startCapture();
    console.log("Starting OCR game capture")
  }

  stopGameCapture() {
    if (!this.stateMachine) return;

    this.stateMachine = undefined;
    this.videoCapture.stopCapture();
    console.log("Ending OCR game capture");
  }

}
