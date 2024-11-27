import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChallengeModalConfig } from 'src/app/components/modals/challenge-modal/challenge-modal.component';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { FriendsService } from 'src/app/services/state/friends.service';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { FriendInfo, FriendStatus } from 'src/app/shared/models/friends';

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
    private modalService: ModalManagerService,
    private friendsService: FriendsService,
  ) {}


  // send a message to server to end friendship between logged-in user and friend
  async endFriendship() {
    this.friendsService.removeFriend(this.friendInfo.userid);
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
    // TODO
  }
}
