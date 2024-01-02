import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NotifierService } from 'angular-notifier';
import { testWASM } from 'client/src/app/libraries/wasm-stackrabbit/wasm-stackrabbit-interface';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { BroadcastAnnouncementMessage, JsonMessageType } from 'network-protocol/json-message';

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
    this.websocketService.connect(this.username, this.username + "@gmail.com");
  }

}
