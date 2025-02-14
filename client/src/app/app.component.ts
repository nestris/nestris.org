import { Component, HostListener, isDevMode, OnInit } from '@angular/core';
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
import { AlertService } from './services/alert.service';
import { InvitationsService } from './services/state/invitations.service';
import { StackrabbitService } from './services/stackrabbit/stackrabbit.service';
import { GamepadService } from './services/gamepad.service';
import { TrophyAlertComponent } from './components/alerts/trophy-alert/trophy-alert.component';
import { QuestAlertComponent } from './components/alerts/quest-alert/quest-alert.component';
import { QuestID } from './shared/nestris-org/quest-system';
import { sleep } from './util/misc';
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
    private alertService: AlertService,
    private invitationsService: InvitationsService,
    private stackrabbitService: StackrabbitService,
    private gamepadService: GamepadService,
    private router: Router,
  ) {

    // Force ngOnDestroy to be called on route change
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
    
  }

  async ngOnInit() {

    console.log("DEV MODE", isDevMode());

    // await sleep(1000);
    // this.alertService.addAlert(TrophyAlertComponent, "trophyAlert", {startTrophies: 1300, trophyDelta: -23});

    // // this.alertService.addAlert(XPAlertComponent, "xpAlert", {league: League.MINO_1, currentXP: 0});
    //this.alertService.addAlert(QuestAlertComponent, "questAlert", {questID: QuestID.AUTOMATON});
    
  }
}