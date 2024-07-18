import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
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

  async login2() {
    const redirectUri = encodeURIComponent(window.location.origin + '/api/v2/callback');
    window.location.href = `http://localhost:3000/api/v2/login?redirectUri=${redirectUri}`;
  }

  async go(str: string) {
    const response = await fetchServer2(Method.GET, `/api/v2/${str}`);
    console.log(response);
  }

}
