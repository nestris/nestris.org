import { Component } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {
  constructor(public websocketService: WebsocketService) { }

  readonly LEADERBOARD_COLORS = ["#FFB938", "#C9C9C9", "#E59650"];
}
