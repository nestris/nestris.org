import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServerAnnouncementService } from './services/server-announcement.service';
import { FriendService } from './services/friend.service';
import { NotificationService } from './services/notification.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {

  constructor(
    private announcementService: ServerAnnouncementService,
    private friendService: FriendService,
    private notificationService: NotificationService,
  ) {
    console.log("AppComponent constructor called");
  }

}