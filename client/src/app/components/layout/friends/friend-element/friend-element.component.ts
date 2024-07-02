import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FriendInfo, FriendStatus, OnlineUserStatus } from 'network-protocol/models/friends';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { endFriendship, sendFriendRequest } from '../friend-util';
import { ModalManagerService, ModalType } from 'client/src/app/services/modal-manager.service';
import { ChallengeModalConfig } from '../../../modals/challenge-modal/challenge-modal.component';
import { FriendsService } from 'client/src/app/services/friends.service';
import { Method, fetchServer2 } from 'client/src/app/scripts/fetch-server';
import { OnlineUserInfo } from 'network-protocol/models/online-user-info';
import { Router } from '@angular/router';
import { NotificationService } from 'client/src/app/services/notification.service';
import { NotificationAutohide, NotificationType } from 'network-protocol/models/notifications';

@Component({
  selector: 'app-friend-element',
  templateUrl: './friend-element.component.html',
  styleUrls: ['./friend-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendElementComponent {
  @Input() friendInfo!: FriendInfo;

  readonly FriendStatus = FriendStatus;
  readonly OnlineUserStatus = OnlineUserStatus;
  readonly ButtonColor = ButtonColor;

  constructor(
    private websocketService: WebsocketService,
    private modalService: ModalManagerService,
    private friendsService: FriendsService,
    private router: Router,
    private notifier: NotificationService
  ) {}

  // get css class for friend status
  getStatusClass(): string {
    switch (this.friendInfo.friendStatus) {
      case FriendStatus.FRIENDS: return "status-friend";
      case FriendStatus.INCOMING: return "status-incoming";
      case FriendStatus.OUTGOING: return "status-pending"
      case FriendStatus.NOT_FRIENDS: return "status-not-friends";
    }
  }

  // send a message to server to accept friend request
  async acceptFriendRequest() {
    await sendFriendRequest(this.websocketService.getUsername()!, this.friendInfo.username);
    this.friendsService.syncWithServer();
  }

  // send a message to server to declne friend request
  async endFriendship() {
    await endFriendship(this.websocketService.getUsername()!, this.friendInfo.username);
    this.friendsService.syncWithServer();
  }

  async sendChallenge() {
    const config: ChallengeModalConfig = {
      opponent: this.friendInfo.username
    };
    this.modalService.showModal(ModalType.CHALLENGE_PLAYER, config);
  }

  // get the current room the friend is in and spectate it
  async spectate() {
    
    // get the room id of the friend
    try {
      const friend = await fetchServer2<OnlineUserInfo>(Method.GET, `/api/v2/online-user/${this.friendInfo.username}`);
      if (!friend.roomID) throw new Error();
      this.router.navigate(['/online/room'], { queryParams: { id: friend.roomID } });
    } catch (e) {
      this.notifier.notify(NotificationType.ERROR, "Unable to spectate this room at this time.", NotificationAutohide.SHORT);
    }
  }
}
