import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from './services/notification.service';
import { PushNotificationService } from './services/push-notification.service';
import { ModalManagerService } from './services/modal-manager.service';
import { MiscMessageHandlerService } from './services/misc-message-handler.service';
import { ServerStatsService } from './services/server-stats.service';
import { BannerManagerService } from './services/banner-manager.service';
import { Router } from '@angular/router';
import { ServerRestartWarningService } from './services/server-restart-warning.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

  constructor(
    private pushNotificationService: PushNotificationService,
    private notificationService: NotificationService,
    public modalManagerService: ModalManagerService,
    private miscMessageHandlerService: MiscMessageHandlerService,
    private serverStatsService: ServerStatsService,
    private bannerManagerService: BannerManagerService,
    private serverRestartWarningService: ServerRestartWarningService,
    private router: Router,
  ) {

    // Force ngOnDestroy to be called on route change
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
  }

  async ngOnInit() {
  }

}