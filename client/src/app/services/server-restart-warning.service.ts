import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WebsocketService } from './websocket.service';
import { JsonMessageType, ServerRestartWarningMessage } from '../shared/network/json-message';
import { BannerManagerService, BannerType } from './banner-manager.service';
import { NotificationService } from './notification.service';
import { NotificationAutohide, NotificationType } from '../shared/models/notifications';
import { FetchService, Method } from './fetch.service';

@Injectable({
  providedIn: 'root'
})
export class ServerRestartWarningService {

  private warning$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private notificationID: string | undefined;

  constructor(
    private fetchService: FetchService,
    private websocketService: WebsocketService,
    private bannerService: BannerManagerService,
    private notificationService: NotificationService
  ) {

    // get whether the server is currently in a restart warning state
    // this.fetchService.fetch(Method.GET, '/api/v2/server-restart-warning').then((response) => {
    //   const warning = (response as any).warning;
    //   console.log("Server restart warning", warning);
    //   this.setWarning(warning);

    // }).catch((error) => {
    //   console.error("Failed to fetch server restart warning", error);
    // });


    // Subscribe to changes in server restart warning
    this.websocketService.onEvent(JsonMessageType.SERVER_RESTART_WARNING).subscribe((warningMessage) => {
      const warning = (warningMessage as ServerRestartWarningMessage).warning;
      console.log("Server restart warning", warning);
      this.setWarning(warning);
    });
  }

  private setWarning(warning: boolean) {

    if (warning) {

      // Send a notification
      this.notificationID = this.notificationService.notify(
        NotificationType.WARNING,
        "The server will restart in a few minutes! Please refrain from starting new games.",
        NotificationAutohide.DISABLED
      );

      // Set a banner
      this.bannerService.addBanner({
        id: BannerType.SERVER_RESTART_WARNING,
        message: "The server will restart in a few minutes! Please refrain from starting new games.",
        color: "#B73C3C",
      });
    } else {
      // Remove the banner
      this.bannerService.removeBanner(BannerType.SERVER_RESTART_WARNING);

      // Remove the notification, if it exists
      if (this.notificationID) {
        this.notificationService.hide(this.notificationID);
        this.notificationID = undefined;
      }
    }

    this.warning$.next(warning);
  }

}
