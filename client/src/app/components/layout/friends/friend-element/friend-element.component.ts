import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeModalConfig } from 'src/app/components/modals/challenge-modal/challenge-modal.component';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { FriendsService } from 'src/app/services/friends.service';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { NotificationService } from 'src/app/services/notification.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { FriendInfo, FriendStatus, OnlineUserStatus } from 'src/app/shared/models/friends';
import { NotificationType, NotificationAutohide } from 'src/app/shared/models/notifications';
import { OnlineUserInfo } from 'src/app/shared/models/online-user-info';
import { sendFriendRequest, endFriendship } from '../friend-util';

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
    await sendFriendRequest(this.websocketService.getUserID()!, this.friendInfo.userid);
    this.friendsService.syncWithServer();
  }

  // send a message to server to declne friend request
  async endFriendship() {
    await endFriendship(this.websocketService.getUserID()!, this.friendInfo.userid);
    this.friendsService.syncWithServer();
  }

  async sendChallenge() {
    const config: ChallengeModalConfig = {
      opponentid: this.friendInfo.userid,
      opponentUsername: this.friendInfo.username
    };
    this.modalService.showModal(ModalType.CHALLENGE_PLAYER, config);
  }

  // get the current room the friend is in and spectate it
  async spectate() {
    
    try {
      // get the friend's room ID, and navigate to the room page
      const friend = await fetchServer2<OnlineUserInfo>(Method.GET, `/api/v2/online-user/${this.friendInfo.username}`);
      if (!friend.roomID) throw new Error();
      this.router.navigate(['/online/room'], { queryParams: { id: friend.roomID } });
    } catch (e) {
      this.notifier.notify(NotificationType.ERROR, "Unable to spectate this room at this time.", NotificationAutohide.SHORT);
    }
  }
}
