import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TabID, getTabIcon } from 'src/app/models/tabs';
import { PingSpeed, PingService } from 'src/app/services/ping.service';
import { WebsocketService } from 'src/app/services/websocket.service';

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
    public websocketService: WebsocketService,
    public pingService: PingService,
  ) { 
  }



}
