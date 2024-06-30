import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { FriendInfo, FriendStatus, OnlineUserStatus } from 'network-protocol/models/friends';
import { Method, fetchServer } from 'client/src/app/scripts/fetch-server';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { JsonMessageType } from 'network-protocol/json-message';

@Component({
  selector: 'app-friend-page',
  templateUrl: './friend-page.component.html',
  styleUrls: ['./friend-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendPageComponent implements OnDestroy {

  readonly ButtonColor = ButtonColor;

  public friendModalVisibility$ = new BehaviorSubject<boolean>(false);

  public friendsInfo$ = new BehaviorSubject<FriendInfo[]>([]);

  private updateOnlineFriendsSubscription: any;

  constructor(
    private websocketService: WebsocketService,
  ) {
    this.updateOnlineFriendsSubscription = this.websocketService.onEvent(JsonMessageType.UPDATE_ONLINE_FRIENDS).subscribe(() => {
      this.syncWithServer();
    });
  }

  async ngOnInit() {
    this.syncWithServer();
  }

  async syncWithServer() {

    const username = this.websocketService.getUsername();
    if (!username) return; // if not logged in, do nothing

    const {status, content} = await fetchServer(Method.GET, `/api/v2/friends/${username}`);
    if (status === 200) this.friendsInfo$.next(content as FriendInfo[]);
  }

  // opens the friend modal when the user clicks on the friend button
  toggleFriendModal(event: MouseEvent) {
    this.friendModalVisibility$.next(!this.friendModalVisibility$.getValue());
    event.stopPropagation(); // prevent the same click from closing the modal
  }

  // sort by friend request type, then by online status, then lexigrapically
  sort(friendsInfo: FriendInfo[]): FriendInfo[] {
    
    // sort lexigraphically. A at the top, Z at the bottom
    friendsInfo.sort((a,b) => a.username < b.username ? -1 : 1);

    // sort by online status. Online at the top, offline at the bottom
    const onlinePriority = (status: OnlineUserStatus) => {
      switch (status) {
        case OnlineUserStatus.IDLE: return 0;
        default: return 1;
      }
    }
    friendsInfo.sort((a,b) => onlinePriority(a.onlineStatus) - onlinePriority(b.onlineStatus));

    // sort by friend request type. Incoming at the top, the pending, then friends
    const friendPriority = (status: FriendStatus) => {
      switch (status) {
        case FriendStatus.INCOMING: return 0;
        case FriendStatus.OUTGOING: return 1;
        default: return 2;
      }
    }
    friendsInfo.sort((a,b) => friendPriority(a.friendStatus) - friendPriority(b.friendStatus));

    // sort whether challenge. Challenge at the top, non-challenge at the bottom
    friendsInfo.sort((a,b) => a.challenge ? 0 : 1);

    return friendsInfo;

  }

  ngOnDestroy(): void {
    this.updateOnlineFriendsSubscription.unsubscribe();
  }

}
