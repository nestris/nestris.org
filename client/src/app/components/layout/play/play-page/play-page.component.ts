import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { NotificationService } from 'src/app/services/notification.service';
import { VideoCaptureService } from 'src/app/services/ocr/video-capture.service';
import { Platform, PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { ServerStatsService } from 'src/app/services/server-stats.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { NotificationType } from 'src/app/shared/models/notifications';
import { DeploymentEnvironment } from 'src/app/shared/models/server-stats';
import { v4 as uuid } from 'uuid';



@Component({
  selector: 'app-play-page',
  templateUrl: './play-page.component.html',
  styleUrls: ['./play-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayPageComponent {

  readonly ButtonColor = ButtonColor;
  readonly Platform = Platform;
  
  constructor(
    public platformService: PlatformInterfaceService,
    public videoCapture: VideoCaptureService,
    private modalManager: ModalManagerService,
    private serverStats: ServerStatsService,
    private fetchService: FetchService,
    private websocketService: WebsocketService,
    private notifier: NotificationService
  ) {

  }

  async setupCalibration(event: MouseEvent | undefined = undefined) {

    if (event) event.stopPropagation();

    // TEMPORARY: OCR platform is disabled for production
    const stats = await this.serverStats.waitForServerStats();
      if (stats.environment === DeploymentEnvironment.PRODUCTION) {
      this.notifier.notify(NotificationType.ERROR, "OCR platform is still under development. Please use emulator platform for now.");
      return;
    }

    this.modalManager.showModal(ModalType.CALIBRATE_OCR);
  }

  async onClickOCRPlatform() {

     // TEMPORARY: OCR platform is disabled for production
     const stats = await this.serverStats.waitForServerStats();
     if (stats.environment === DeploymentEnvironment.PRODUCTION) {
     this.notifier.notify(NotificationType.ERROR, "OCR platform is still under development. Please use emulator platform for now.");
     return;
   }

    // if calibration is valid, switch to OCR platform
    if (this.videoCapture.getCalibrationValid()) {
      this.platformService.setPlatform(Platform.OCR);
    } else { // Otherwise, first calibrate
      this.setupCalibration();
    }
  }

  async playSolo() {
    const sessionID = this.websocketService.getSessionID();
    this.fetchService.fetch(Method.POST, `/api/v2/create-solo-room/${sessionID}`);
    
  }


  comingSoon() {
    this.notifier.notify(NotificationType.ERROR, "This feature is currently in development. Coming soon!");
  }

}
