import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from './services/notification.service';
import { PushNotificationService } from './services/push-notification.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {

  constructor(
    private pushNotificationService: PushNotificationService,
    private notificationService: NotificationService,
  ) {
    console.log("AppComponent constructor called");
  }

}