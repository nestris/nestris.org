import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { WebsocketService } from 'src/app/services/websocket.service';
import { LessonHeader } from 'src/app/shared/models/lesson';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  lessons$ = new BehaviorSubject<LessonHeader[]>([]);

  constructor(websocket: WebsocketService) { }

  async ngOnInit() {
    
    // Fetch all lessons from the server
    const lessonDict = await fetchServer2<{[key: string]: LessonHeader}>(Method.GET, '/api/v2/lesson');
    this.lessons$.next(Object.values(lessonDict));

  }

}
