import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FriendService } from 'client/src/app/services/friend.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { RoutingService } from 'client/src/app/services/routing.service';
import { TabID } from 'client/src/app/models/tabs';
import { FriendInfo, FriendStatus, OnlineUserStatus } from 'network-protocol/models/friends';

@Component({
  selector: 'app-friend-page',
  templateUrl: './friend-page.component.html',
  styleUrls: ['./friend-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendPageComponent implements OnDestroy {

  readonly ButtonColor = ButtonColor;

  public friendModalVisibility$ = new BehaviorSubject<boolean>(false);

  private tabSubscription!: Subscription;

  constructor(
    public friendService: FriendService,
    public tabService: RoutingService
  ) {

    // resync friends data (specifically, xp and trophies) when switching to friends tab
    // stuff like online status should already be updated through events
    this.tabSubscription = tabService.onSwitchToTab(TabID.FRIENDS).subscribe(() => {
      this.friendService.syncWithServer();
    });

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
        case FriendStatus.PENDING: return 1;
        default: return 2;
      }
    }
    friendsInfo.sort((a,b) => friendPriority(a.friendStatus) - friendPriority(b.friendStatus));


    return friendsInfo;

  }

  ngOnDestroy(): void {
    this.tabSubscription.unsubscribe();
  }

}
