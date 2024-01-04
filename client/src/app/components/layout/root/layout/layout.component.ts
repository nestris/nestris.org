import { Component } from '@angular/core';
import { SidebarTabService } from 'client/src/app/services/sidebar-tab.service';
import { TabID } from 'client/src/app/models/tabs';
import { WebsocketService } from 'client/src/app/services/websocket.service';

@Component({

  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {

  readonly TabID = TabID;

  constructor(
    public sidebarTabService: SidebarTabService,
    public websocketService: WebsocketService,
    ) { 
    console.log("Root constructor called", this.sidebarTabService);
  }

  public test(a: any) {
    console.log("test", a);
  }

}
