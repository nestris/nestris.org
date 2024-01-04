import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TabID, getTabIcon } from 'client/src/app/models/tabs';
import { PingService, PingSpeed } from 'client/src/app/services/ping.service';
import { RoutingService } from 'client/src/app/services/routing.service';
import { WebsocketService } from 'client/src/app/services/websocket.service';

@Component({
  selector: 'app-profile-tab',
  templateUrl: './profile-tab.component.html',
  styleUrls: ['./profile-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileTabComponent {

  readonly TabID = TabID;
  readonly PingSpeed = PingSpeed;

  public tabIcon = getTabIcon(TabID.MY_PROFILE);

  constructor(
    public sidebarTabService: RoutingService,
    public websocketService: WebsocketService,
    public pingService: PingService,
  ) { 
  }

  onTabClick(): void {
    this.sidebarTabService.setSelectedTab({tab: TabID.MY_PROFILE, params: undefined});
  }



}
