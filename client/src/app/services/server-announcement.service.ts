import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { BroadcastAnnouncementMessage, JsonMessageType } from 'network-protocol/json-message';
import { NotificationAutohide, NotificationService, NotificationType } from './notification.service';

/*
Listens to websocket messages, and for each announcement message, displays a notification.
*/

@Injectable({
  providedIn: 'root'
})
export class ServerAnnouncementService {

  constructor(
    private websocketService: WebsocketService,
    private notificationService: NotificationService,
  ) {

    this.websocketService.onEvent(JsonMessageType.BROADCAST_ANNOUNCEMENT).subscribe((message) => {
      const announcement = (message as BroadcastAnnouncementMessage).announcement;
      console.log('Received broadcast announcement:', announcement);
      this.notificationService.notify(NotificationType.INFO, announcement, NotificationAutohide.DISABLED);
    });

  }
}
