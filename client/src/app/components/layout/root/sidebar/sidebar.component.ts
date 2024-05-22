import { Component, ChangeDetectionStrategy, Input, OnInit, OnDestroy } from '@angular/core';
import { TabID } from 'client/src/app/models/tabs';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { OnlineUserStatus } from 'network-protocol/models/friends';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { ModalManagerService, ModalType } from 'client/src/app/services/modal-manager.service';
import { BehaviorSubject } from 'rxjs';
import { Method, fetchServer2 } from 'client/src/app/scripts/fetch-server';
import { JsonMessageType } from 'network-protocol/json-message';

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

  ngOnDestroy() {
    this.subscriptionA.unsubscribe();
    this.subscriptionB.unsubscribe();
  }

}
