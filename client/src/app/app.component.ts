import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from './services/notification.service';
import { PushNotificationService } from './services/push-notification.service';
import { ModalManagerService } from './services/modal-manager.service';
import { OcrDigitService } from './services/ocr/ocr-digit.service';
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
  ) {
    console.log("AppComponent constructor called");
  }

  async ngOnInit() {
    this.ocrDigitService.init();
  }

}