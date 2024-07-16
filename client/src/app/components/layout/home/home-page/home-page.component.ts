import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent implements OnInit {

  public username: string = "test";

  constructor(public websocketService: WebsocketService) {

  }

  async ngOnInit() {

  }

  login() {
    this.websocketService.connect(this.username);
  }

}
