import { Component } from '@angular/core';
import { FullscreenMode, RoutingService } from 'client/src/app/services/routing.service';
import { TabID } from 'client/src/app/models/tabs';
import { WebsocketService } from 'client/src/app/services/websocket.service';

@Component({

  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {

  readonly TabID = TabID;
  readonly FullscreenMode = FullscreenMode;

  constructor(
    public sidebarTabService: RoutingService,
    public websocketService: WebsocketService,
    ) { 
    console.log("Root constructor called", this.sidebarTabService);
  }

  public test(a: any) {
    console.log("test", a);
  }

}
