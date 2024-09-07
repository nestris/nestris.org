import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { NotificationService } from 'src/app/services/notification.service';
import { VideoCaptureService } from 'src/app/services/ocr/video-capture.service';
import { Platform, PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { NotificationType } from 'src/app/shared/models/notifications';
import { JsonMessageType, StartSoloRoomMessage } from 'src/app/shared/network/json-message';
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
    private router: Router,
    private websocket: WebsocketService,
    private notifier: NotificationService
  ) {

  }

  setupCalibration() {
    this.modalManager.showModal(ModalType.CALIBRATE_OCR);
  }

  onClickOCRPlatform() {
    // if calibration is valid, switch to OCR platform
    if (this.videoCapture.getCalibrationValid()) {
      this.platformService.setPlatform(Platform.OCR);
    } else { // Otherwise, first calibrate
      this.setupCalibration();
    }
  }

  async playSolo() {

    if (this.websocket.isSignedIn()) {
      // if signed in, attempt to create a new room and go to solo play
      // if player already in a room in a different socket, do not go to solo play but instead show an error

      const id = uuid();

      // handle response to START_SOLO_ROOM message
      const subscription = this.websocket.onEvent(JsonMessageType.START_SOLO_ROOM).subscribe((m) => {

        const message = m as StartSoloRoomMessage;
        if (message.id !== id) return; // verify that the message is for this request

        subscription.unsubscribe();

        if (message.success && message.roomID) {

          // go to solo play
          this.notifier.notify(NotificationType.SUCCESS, "Room created successfully.");
          this.router.navigate(['/online/room'], { queryParams: {
            id: message.roomID,
            exit: encodeURIComponent("/play")
          } });
        } else {
          // show error message
          this.notifier.notify(NotificationType.ERROR, "You are already on a game on a different device. Please close the game on the other device first.")
        }
      });

      this.websocket.sendJsonMessage(new StartSoloRoomMessage(id));

    } else {
      // if not signed in, go to solo play without creating a room
      // TODO: warning that progress will not be saved
      this.router.navigate(['/online/room'], { queryParams: { exit: encodeURIComponent("/play") } });
    }

    
  }

}
