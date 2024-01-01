import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { testWASM } from 'client/src/app/libraries/wasm-stackrabbit/wasm-stackrabbit-interface';
import { WebsocketService } from 'client/src/app/services/websocket.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent implements OnInit {

  constructor(public websocketService: WebsocketService) {
  }

  async ngOnInit() {

    testWASM();

  }

}
