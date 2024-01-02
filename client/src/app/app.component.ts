import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServerAnnouncementService } from './services/server-announcement.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {

  constructor(
    private announcementService: ServerAnnouncementService,
  ) {
    console.log("AppComponent constructor called");
  }

}