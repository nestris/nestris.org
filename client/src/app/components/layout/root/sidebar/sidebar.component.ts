import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { TabID } from 'src/app/models/tabs';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { VideoCaptureService } from 'src/app/services/ocr/video-capture.service';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { ServerStatsService } from 'src/app/services/server-stats.service';
import { FriendsService } from 'src/app/services/state/friends.service';
import { MeService } from 'src/app/services/state/me.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DBUser, Authentication, LoginMethod } from 'src/app/shared/models/db-user';
import { Platform } from 'src/app/shared/models/platform';
import { DeploymentEnvironment } from 'src/app/shared/models/server-stats';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {

  readonly TabID = TabID;
  readonly ButtonColor = ButtonColor;

  readonly DeploymentEnvironment = DeploymentEnvironment;
  readonly LoginMethod = LoginMethod;
  readonly Platform = Platform;

  private _isExpanded = new BehaviorSubject<boolean>(window.innerWidth > 1000);
  isExpanded$ = this._isExpanded.asObservable();

  constructor(
    private friendsService: FriendsService,
    public websocketService: WebsocketService,
    public videoCaptureService: VideoCaptureService,
    public modalService: ModalManagerService,
    public serverStatsService: ServerStatsService,
    public platform: PlatformInterfaceService,
    public meService: MeService,
  ) {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  numOnlineFriends$ = this.friendsService.getNumOnlineFriends$();

  openAuthModal(): void {
    this.modalService.showModal(ModalType.AUTH);
  }

  showControlPanel(user: DBUser | undefined | null): boolean {
    if (!user) return false;
    return (user.authentication !== Authentication.USER);
  }

  private onResize() {
    const isWide = window.innerWidth > 1000;
    if (this._isExpanded.value !== isWide) {
      this._isExpanded.next(isWide);
    }
  }
  

}
