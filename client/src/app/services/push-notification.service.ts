import { Injectable } from '@angular/core';
import { NotificationAutohide } from '../shared/models/notifications';
import { JsonMessageType, SendPushNotificationMessage } from '../shared/network/json-message';
import { NotificationService } from './notification.service';
import { WebsocketService } from './websocket.service';

/*
Listens to websocket messages, and for each announcement message, displays a notification.
*/

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {

  constructor(
    private websocketService: WebsocketService,
    private notificationService: NotificationService,
  ) {

    console.log("PushNotificationService constructor called");

    this.websocketService.onEvent(JsonMessageType.SEND_PUSH_NOTIFICATION).subscribe((message) => {
      const pushNotification = (message as SendPushNotificationMessage);
      console.log('Received push notification:', pushNotification.notificationType, pushNotification.message);
      this.notificationService.notify(pushNotification.notificationType, pushNotification.message, NotificationAutohide.LONG);
    });

  }
}
