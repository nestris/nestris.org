import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { FriendsService } from 'src/app/services/state/friends.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { FriendStatus, FriendInfo } from 'src/app/shared/models/friends';
import { DBUser } from 'src/app/shared/models/db-user';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { MeService } from 'src/app/services/state/me.service';
import { InvitationRelationship, InvitationsService } from 'src/app/services/state/invitations.service';
import { InvitationType } from 'src/app/shared/models/invitation';
import { InvitationMode } from 'src/app/shared/network/json-message';
import { v4 as uuid } from 'uuid';
import { NotificationService } from 'src/app/services/notification.service';
import { NotificationType } from 'src/app/shared/models/notifications';

const MAX_OUTGOING_FRIEND_REQUESTS = 5;

interface PotentialFriend {
  userid: string;
  username: string;
  friendStatus: FriendStatus;
}

@Component({
  selector: 'app-add-friend-modal',
  templateUrl: './add-friend-modal.component.html',
  styleUrls: ['./add-friend-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddFriendModalComponent implements OnInit, OnDestroy {
  @Input() visibility$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  public pattern = '';
  public potentialFriends$ = new BehaviorSubject<PotentialFriend[]>([]);

  private matchingUsers: {
      userid: string;
      username: string;
  }[] = [];

  readonly FriendStatus = FriendStatus;

  constructor(
    private meService: MeService,
    private websocketService: WebsocketService,
    private fetchService: FetchService,
    private friendsService: FriendsService,
    private invitationsService: InvitationsService,
    private notificationService: NotificationService,
    ) {

      // Recalculate the potential friends list when the invitations or friends list changes
      invitationsService.onChange(() => this.recalculatePotentialFriendsFromMatchingUsers());
      friendsService.onChange(() => this.recalculatePotentialFriendsFromMatchingUsers());
    }

  async ngOnInit() {
    this.onPatternChange('');
  }

  private async getFriendStatus(friends: FriendInfo[], friendID: string): Promise<FriendStatus> {

    // If the user is already friends with the potential friend, return FRIENDS
    if (friends.find(friend => friend.userid === friendID)) return FriendStatus.FRIENDS;

    // Check if the user has an outgoing or incoming friend request with the potential friend
    const friendRelationship = await this.invitationsService.getInvitationRelationship(InvitationType.FRIEND_REQUEST, friendID);
    switch (friendRelationship) {
      case InvitationRelationship.IS_SENDER: return FriendStatus.OUTGOING;
      case InvitationRelationship.IS_RECEIVER: return FriendStatus.INCOMING;
      default: return FriendStatus.NOT_FRIENDS;
    }
  }

  /**
   * When the user types in the input field, update the potential friends list
   * @param event The input event
   */
  public async onPatternChange(pattern: string) {

    // Fetch the users that match the typed username
    this.matchingUsers = await this.fetchService.fetch<{userid: string, username: string}[]>(Method.GET, `/api/v2/usernames-list/${pattern}`);

    // Filter out the user's own username
    const myID = (await this.meService.get()).userid;
    this.matchingUsers = this.matchingUsers.filter(user => user.userid !== myID);

    // Recalculate the potential friends list
    await this.recalculatePotentialFriendsFromMatchingUsers();
  }

  private async recalculatePotentialFriendsFromMatchingUsers() {
    const friends = await this.friendsService.get();

    // Update the potential friends list
    this.potentialFriends$.next(await Promise.all(this.matchingUsers.map(async (user) => {
      return {
        userid: user.userid,
        username: user.username,
        friendStatus: await this.getFriendStatus(friends, user.userid)
      }
    })));
  }

  public async addFriend(potentialFriend: PotentialFriend) {

    const myID = (await this.meService.get()).userid;
    const myUsername = (await this.meService.get()).username;
    const sessionID = this.websocketService.getSessionID();

    switch (potentialFriend.friendStatus) {

      // Create a friend request if the user is not friends with the potential friend
      case FriendStatus.NOT_FRIENDS:

        // Check if the user has reached the maximum number of outgoing friend requests
        const currentInvitations = await this.invitationsService.getInvitationsBySender(InvitationType.FRIEND_REQUEST, myID);
        if (currentInvitations.length >= MAX_OUTGOING_FRIEND_REQUESTS) {
          this.notificationService.notify(NotificationType.ERROR, `You've reached the maximum number of ${MAX_OUTGOING_FRIEND_REQUESTS} outgoing friend requests.`);
          return;
        }

        // Create the friend request invitation and send it to the potential friend
        this.invitationsService.sendInvitationMessage(InvitationMode.CREATE, {
          type: InvitationType.FRIEND_REQUEST,
          invitationID: uuid(),
          senderID: myID,
          senderUsername: myUsername,
          senderSessionID: sessionID,
          receiverID: potentialFriend.userid,
          receiverUsername: potentialFriend.username,
        });
        break;

      // Accept the friend request if the user has an incoming friend request from the potential friend
      case FriendStatus.INCOMING:
        const invitation = await this.invitationsService.getInvitationBySenderReceiver(InvitationType.FRIEND_REQUEST, potentialFriend.userid, myID);
        if (!invitation) throw new Error(`No incoming friend request from ${potentialFriend.username}`);
        this.invitationsService.sendInvitationMessage(InvitationMode.ACCEPT, invitation);
        break;

      // Do nothing if the user is already friends with the potential friend, or has an outgoing friend request
      case FriendStatus.OUTGOING:
      case FriendStatus.FRIENDS:
        // Do nothing
    }
  }

  

  // userMatchesTypedUsername(friend: PotentialFriend) {
  //   return false;
  //   //return friend.username.toLowerCase().includes(this.typedUsername.toLowerCase());
  // }

  ngOnDestroy() {
  }

}
