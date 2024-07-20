import { Component } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {

  login() {
    // After discord login, redirect to this callback URL in the server to process the code
    let baseURL = window.location.origin;
    // remove port number if it exists
    if (baseURL.split(":").length > 1) baseURL = baseURL.slice(0, baseURL.lastIndexOf(":"));
    const redirectUri = encodeURIComponent(baseURL + '/api/v2/callback');

    // Redirect to discord login page. Hard refresh to avoid CORS issues
    location.href = `api/v2/login?redirectUri=${redirectUri}`;
  }

}
