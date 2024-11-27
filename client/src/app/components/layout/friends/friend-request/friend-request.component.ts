import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { InvitationsService } from 'src/app/services/state/invitations.service';
import { Invitation, InvitationType } from 'src/app/shared/models/invitation';
import { InvitationMode } from 'src/app/shared/network/json-message';

enum FriendRequestMode {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing'
}

@Component({
  selector: 'app-friend-request',
  templateUrl: './friend-request.component.html',
  styleUrls: ['./friend-request.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendRequestComponent {
  @Input() request!: Invitation;
  @Input() myID!: string;

  readonly FriendRequestMode = FriendRequestMode;
  readonly ButtonColor = ButtonColor;

  constructor(
    private invitationsService: InvitationsService
  ) {}


  getMode(): FriendRequestMode {
    if (this.request.senderID === this.myID) {
      return FriendRequestMode.OUTGOING;
    } else {
      return FriendRequestMode.INCOMING;
    }
  }

  getUsername(mode: FriendRequestMode): string {
    return mode === FriendRequestMode.OUTGOING ? this.request.receiverUsername : this.request.senderUsername;
  }

  /**
   * Cancels/Rejects the friend request
   * Precondition: This is an outgoing friend request
   */
  cancelFriendRequest() {
    this.invitationsService.sendInvitationMessage(InvitationMode.CANCEL, this.request);
  }

  /**
   * Accepts the friend request
   * Precondition: This is an incoming friend request
   */
  acceptFriendRequest() {
    this.invitationsService.sendInvitationMessage(InvitationMode.ACCEPT, this.request);
  }

}
