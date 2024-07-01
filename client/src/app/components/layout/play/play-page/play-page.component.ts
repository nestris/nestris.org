import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { Tetromino } from 'network-protocol/tetris/tetrominos';
import MoveableTetromino from 'network-protocol/tetris/moveable-tetromino';
import { ALL_TETROMINO_TYPES } from 'network-protocol/tetris/tetromino-type';
import { Platform, PlatformInterfaceService } from 'client/src/app/services/platform-interface.service';
import { TabID } from 'client/src/app/models/tabs';
import { ModalManagerService, ModalType } from 'client/src/app/services/modal-manager.service';
import { Router } from '@angular/router';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { JsonMessageType, StartSoloRoomMessage } from 'network-protocol/json-message';
import { NotificationService } from 'client/src/app/services/notification.service';
import { NotificationType } from 'network-protocol/models/notifications';
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
    private modalManager: ModalManagerService,
    private router: Router,
    private websocket: WebsocketService,
    private notifier: NotificationService
  ) {

  }

  setupCalibration() {
    this.modalManager.showModal(ModalType.CALIBRATE_OCR);
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
