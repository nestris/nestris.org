import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeModalConfig } from 'src/app/components/modals/challenge-modal/challenge-modal.component';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { FriendsService } from 'src/app/services/friends.service';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { NotificationService } from 'src/app/services/notification.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { FriendInfo, FriendStatus, OnlineUserStatus } from 'src/app/shared/models/friends';
import { NotificationType, NotificationAutohide } from 'src/app/shared/models/notifications';
import { OnlineUserInfo } from 'src/app/shared/models/online-user-info';
import { FetchService, Method } from 'src/app/services/fetch.service';

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
    private fetchService: FetchService,
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
  }

  // send a message to server to declne friend request
  async endFriendship() {
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
      const friend = await this.fetchService.fetch<OnlineUserInfo>(Method.GET, `/api/v2/online-user/${this.friendInfo.userid}`);
      if (!friend.roomID) throw new Error();
      this.router.navigate(['/online/room'], { queryParams: { id: friend.roomID } });
    } catch (e) {
      this.notifier.notify(NotificationType.ERROR, "Unable to spectate this room at this time.", NotificationAutohide.SHORT);
    }
  }
}
