import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TabID, getTabIcon } from 'src/app/models/tabs';
import { PingSpeed, PingService } from 'src/app/services/ping.service';
import { MeService } from 'src/app/services/state/me.service';

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
    public meService: MeService,
    public pingService: PingService,
  ) { 
  }



}
