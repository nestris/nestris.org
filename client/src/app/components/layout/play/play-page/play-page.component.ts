import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Mode } from 'src/app/components/ui/mode-icon/mode-icon.component';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { NotificationService } from 'src/app/services/notification.service';
import { VideoCaptureService } from 'src/app/services/ocr/video-capture.service';
import { Platform, PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { RankedQueueService } from 'src/app/services/room/ranked-queue.service';
import { ServerStatsService } from 'src/app/services/server-stats.service';
import { MeService } from 'src/app/services/state/me.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { NotificationType } from 'src/app/shared/models/notifications';
import { DeploymentEnvironment } from 'src/app/shared/models/server-stats';


@Component({
  selector: 'app-play-page',
  templateUrl: './play-page.component.html',
  styleUrls: ['./play-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayPageComponent {

  readonly ButtonColor = ButtonColor;
  readonly Platform = Platform;

  readonly modes = Object.values(Mode);

  public me$ = this.meService.get$();

  
  constructor(
    public platformService: PlatformInterfaceService,
    public videoCapture: VideoCaptureService,
    private meService: MeService,
    private modalManager: ModalManagerService,
    private serverStats: ServerStatsService,
    private fetchService: FetchService,
    private websocketService: WebsocketService,
    private notifier: NotificationService,
    private rankedQueueService: RankedQueueService,
    private router: Router
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

  async playRanked() {

    // Attempt to join the ranked queue
    const success = await this.rankedQueueService.joinQueue();

    // If successful, navigate to the ranked queue
    if (success) this.router.navigate(['/online/ranked']);
  }

  onClickMode(mode: Mode) {
    switch (mode) {
      case Mode.SOLO: return this.playSolo();
      case Mode.RANKED: return this.playRanked();
      case Mode.PUZZLES: return undefined;
    }
  }

  capitalize(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }


  comingSoon() {
    this.notifier.notify(NotificationType.ERROR, "This feature is currently in development. Coming soon!");
  }

}
