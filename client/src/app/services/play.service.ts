import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationType } from '../shared/models/notifications';
import { Platform } from '../shared/models/platform';
import { FetchService, Method } from './fetch.service';
import { ModalManagerService, ModalType } from './modal-manager.service';
import { NotificationService } from './notification.service';
import { VideoCaptureService } from './ocr/video-capture.service';
import { PlatformInterfaceService } from './platform-interface.service';
import { RankedQueueService } from './room/ranked-queue.service';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class PlayService {

  constructor(
    public platformService: PlatformInterfaceService,
    public videoCapture: VideoCaptureService,
    private modalManager: ModalManagerService,
    private fetchService: FetchService,
    private websocketService: WebsocketService,
    private notifier: NotificationService,
    private rankedQueueService: RankedQueueService,
    private router: Router,
  ) { }


  // If in OCR mode, opens up modal if video source disconnected. Returns true if need to open up modal
  private checkVideoSource(callback: () => void): boolean {

    if (this.platformService.getPlatform() === Platform.ONLINE) return false;
    if (this.videoCapture.getCalibrationValid()) return false;

    this.notifier.notify(NotificationType.WARNING, "Your capture source was disconnected and needs to be recalibrated.");
    this.modalManager.showModal(ModalType.CALIBRATE_OCR, {}, () => {
      if (this.platformService.getPlatform() === Platform.OCR && this.videoCapture.getCalibrationValid()) {
        callback();
      }
    });
    
    return true;
  }

  async playSolo(checkVideoSource: boolean = true) {

    if (checkVideoSource && this.checkVideoSource(() => this.playSolo(false))) return;

    const sessionID = this.websocketService.getSessionID();
    this.fetchService.fetch(Method.POST, `/api/v2/create-solo-room/${sessionID}`);
  }

  async playRanked(checkVideoSource: boolean = true) {

    if (checkVideoSource && this.checkVideoSource(() => this.playRanked(false))) return;

    // Attempt to join the ranked queue
    await this.rankedQueueService.joinQueue();
  }

  async playPuzzles() {
    this.router.navigate(['/online/puzzle'], { 
      queryParams: { mode: 'rated' } 
    });
  }
}
