import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FriendInfo, FriendStatus } from 'network-protocol/models/friends';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { endFriendship, sendFriendRequest } from '../friend-util';
import { ModalManagerService, ModalType } from 'client/src/app/services/modal-manager.service';
import { ChallengeModalConfig } from '../../../modals/challenge-modal/challenge-modal.component';
import { FriendsService } from 'client/src/app/services/friends.service';

@Component({
  selector: 'app-friend-element',
  templateUrl: './friend-element.component.html',
  styleUrls: ['./friend-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendElementComponent {
  @Input() friendInfo!: FriendInfo;

  readonly FriendStatus = FriendStatus;
  readonly ButtonColor = ButtonColor;

  constructor(
    private websocketService: WebsocketService,
    private modalService: ModalManagerService,
    private friendsService: FriendsService
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



}
