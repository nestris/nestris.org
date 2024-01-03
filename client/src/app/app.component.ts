import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServerAnnouncementService } from './services/server-announcement.service';
import { FriendService } from './services/friend.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {

  constructor(
    private announcementService: ServerAnnouncementService,
    private friendService: FriendService,
  ) {
    console.log("AppComponent constructor called");
  }

}