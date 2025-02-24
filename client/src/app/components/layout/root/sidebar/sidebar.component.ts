import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { OCRState } from 'src/app/components/ui/ocr-button/ocr-button.component';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { TabID } from 'src/app/models/tabs';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { VideoCaptureService } from 'src/app/services/ocr/video-capture.service';
import { ServerStatsService } from 'src/app/services/server-stats.service';
import { FriendsService } from 'src/app/services/state/friends.service';
import { MeService } from 'src/app/services/state/me.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DBUser, Authentication, LoginMethod } from 'src/app/shared/models/db-user';
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
  readonly OCRState = OCRState;

  constructor(
    private friendsService: FriendsService,
    public websocketService: WebsocketService,
    public modalService: ModalManagerService,
    public serverStatsService: ServerStatsService,
    public videoCaptureService: VideoCaptureService,
    public meService: MeService,
  ) {}

  numOnlineFriends$ = this.friendsService.getNumOnlineFriends$();
  ocrState$ = this.videoCaptureService.getCalibrationValid$().pipe(
    map(valid => valid ? OCRState.CONNECTED : OCRState.DISCONNECTED)
  );

  openAuthModal(): void {
    this.modalService.showModal(ModalType.AUTH);
  }

  showControlPanel(user: DBUser | undefined | null): boolean {
    if (!user) return false;
    return (user.authentication !== Authentication.USER);
  }

  

}
