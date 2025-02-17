import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProfileModalConfig } from 'src/app/components/modals/profile-modal/profile-modal.component';
import { TabID, getTabIcon } from 'src/app/models/tabs';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
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
    public readonly meService: MeService,
    public readonly pingService: PingService,
    private readonly modalManagerService: ModalManagerService,
  ) {}

  async openProfile() {
    const config: ProfileModalConfig = {
      userid: await this.meService.getUserID()
    }
    this.modalManagerService.showModal(ModalType.PROFILE, config);
  }

}
