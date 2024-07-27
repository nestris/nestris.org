import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from './services/notification.service';
import { PushNotificationService } from './services/push-notification.service';
import { ModalManagerService } from './services/modal-manager.service';
import { OcrDigitService } from './services/ocr/ocr-digit.service';
import { MiscMessageHandlerService } from './services/misc-message-handler.service';
import { ServerStatsService } from './services/server-stats.service';
import { BannerManagerService } from './services/banner-manager.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

  constructor(
    private pushNotificationService: PushNotificationService,
    private notificationService: NotificationService,
    public modalManagerService: ModalManagerService,
    private ocrDigitService: OcrDigitService,
    private miscMessageHandlerService: MiscMessageHandlerService,
    private serverStatsService: ServerStatsService,
    private bannerManagerService: BannerManagerService,
  ) {
  }

  async ngOnInit() {
    this.ocrDigitService.init();
  }

}