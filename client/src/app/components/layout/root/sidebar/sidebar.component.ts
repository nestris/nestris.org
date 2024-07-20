import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { TabID } from 'src/app/models/tabs';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DBUser, PermissionLevel } from 'src/app/shared/models/db-user';
import { OnlineUserStatus } from 'src/app/shared/models/friends';
import { JsonMessageType } from 'src/app/shared/network/json-message';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {

  readonly TabID = TabID;
  readonly OnlineUserStatus = OnlineUserStatus;
  readonly ButtonColor = ButtonColor;

  public numOnlineFriends$ = new BehaviorSubject<number>(0);

  private subscriptionA: any;
  private subscriptionB: any;

  constructor(
    public websocketService: WebsocketService,
    public modalService: ModalManagerService
  ) {}

  async ngOnInit() {

    // on recieved UPDATE_ONLINE_FRIENDS message, sync number of online friends with server
    this.subscriptionA = this.websocketService.onEvent(JsonMessageType.UPDATE_ONLINE_FRIENDS).subscribe(() => {
      this.syncOnlineFriends();
    });

    // on sign in, sync number of online friends with server
    this.subscriptionB = this.websocketService.onSignIn().subscribe(() => {
      this.syncOnlineFriends();
    });

    await this.syncOnlineFriends();
    
  }

  async syncOnlineFriends() {

    const username = this.websocketService.getUsername();
    if (!username) return; // if not logged in, do nothing

    const result = await fetchServer2<{count: number}>(Method.GET, `/api/v2/num-online-friends/${username}`);
    this.numOnlineFriends$.next(result.count);

  }

  openAuthModal(): void {
    this.modalService.showModal(ModalType.AUTH);
  }

  showControlPanel(user: DBUser | undefined | null): boolean {
    if (!user) return false;
    return (user.permission !== PermissionLevel.DEFAULT);
  }

  ngOnDestroy() {
    this.subscriptionA.unsubscribe();
    this.subscriptionB.unsubscribe();
  }

}
