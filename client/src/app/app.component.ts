import { Component, isDevMode, OnInit } from '@angular/core';
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
import { RoomService } from './services/room/room.service';
import { SoloGamesListService } from './services/state/solo-games-list.service';
import { AlertService } from './services/alert.service';
import { TestAlertComponent } from './components/alerts/test-alert/test-alert.component';
import { XPAlertComponent } from './components/alerts/xp-alert/xp-alert.component';
import { League } from './shared/nestris-org/league-system';
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
    private roomService: RoomService,
    private soloGamesListService: SoloGamesListService,
    private alertService: AlertService,
    private router: Router,
  ) {

    // Force ngOnDestroy to be called on route change
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };

    
  }

  async ngOnInit() {

    console.log("DEV MODE", isDevMode());

    await new Promise(resolve => setTimeout(resolve, 500));
    this.alertService.addAlert(XPAlertComponent, "xpAlert", {league: League.MINO_5, xp: 200});

    await new Promise(resolve => setTimeout(resolve, 1000));
    this.alertService.updateAlert("xpAlert", {xp: 5000});
    
  }
}