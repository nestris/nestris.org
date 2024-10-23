import { Component, ElementRef, isDevMode, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from './services/notification.service';
import { PushNotificationService } from './services/push-notification.service';
import { ModalManagerService } from './services/modal-manager.service';
import { MiscMessageHandlerService } from './services/misc-message-handler.service';
import { ServerStatsService } from './services/server-stats.service';
import { BannerManagerService } from './services/banner-manager.service';
import { Router } from '@angular/router';
import { ServerRestartWarningService } from './services/server-restart-warning.service';
import { CacheableRequestService } from './services/cacheable-request.service';
import { MeService } from './services/state/me.service';
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
    private cacheableRequestService: CacheableRequestService,
    private meService: MeService,
    private router: Router,
  ) {

    // Force ngOnDestroy to be called on route change
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };

    
  }

  async ngOnInit() {

    console.log("DEV MODE", isDevMode());

    console.log("gg");

    const me = await this.meService.get();
    console.log("Me", me);

    console.log("asdf");

  }
}