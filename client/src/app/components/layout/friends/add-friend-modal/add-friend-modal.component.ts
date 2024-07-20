import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { FriendsService } from 'src/app/services/friends.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { FriendStatus, FriendInfo } from 'src/app/shared/models/friends';
import { sendFriendRequest } from '../friend-util';
import { DBUser } from 'src/app/shared/models/db-user';

// This is super cursed and definitely not the right way to go about things.
// But it works for now so whatever.

export interface PotentialFriend {
  userid: string;
  username: string;
  status: FriendStatus;
}

@Component({
  selector: 'app-add-friend-modal',
  templateUrl: './add-friend-modal.component.html',
  styleUrls: ['./add-friend-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddFriendModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input() visibility$!: BehaviorSubject<boolean>;
  @Input() friendsInfo!: FriendInfo[];
  
  public typedUsername: string = "";
  public potentialFriends?: PotentialFriend[];

  private matchingUsers: DBUser[] = [];

  private visibilitySubscription!: Subscription;

  constructor(
    private websocketService: WebsocketService,
    private friendsService: FriendsService,
    private cdr: ChangeDetectorRef
    ) {

    }

  async ngOnInit() {

    this.visibilitySubscription = this.visibility$.subscribe((visibility) => {
      if (visibility) this.ngOnChanges();
    });
    
    // fetch list of all usernames from server
    this.matchingUsers = await fetchServer2<DBUser[]>(Method.GET, '/api/v2/users-by-username', undefined, this.websocketService);
  }

  /*
    Using the fetched users list, compare with user's list of friends and
    see which ones are not already friends.
    Updates this.potentialFriends[]

    FUTURE CONSIDERATION: if this is too slow, consider delaying fetch until
    user has typed in a letter or two to user search, then only return the subset
    of usernames beginning with those letters
  */
  async ngOnChanges() {

    // only update potential friends if friends info has been loaded
    if (this.friendsInfo === undefined) return;
    const friendsInfo = this.friendsInfo;
    
    // compare the list of usernames with the user's friends list
    const myUserID = this.websocketService.getUserID();
    this.potentialFriends = [];
    this.matchingUsers.forEach((user: DBUser) => {

      // do not show myself in list
      if (myUserID === user.userid) return;

      let status = FriendStatus.NOT_FRIENDS;
      const friend = friendsInfo.find((friendInfo) => friendInfo.userid === user.userid); // find matching username on friends list, if any
      if (friend !== undefined) status = friend.friendStatus;

      this.potentialFriends!.push({
        userid: user.userid,
        username: user.username,
        status: status
      });
    });

    // trigger manual change detection to reflect the change in potential friends
    this.cdr.detectChanges();
  }

  // called when user clicks on a potential friend "add friend" icon
  sendFriendRequest(potentialFriend: PotentialFriend) {
    
    const userid = this.websocketService.getUserID();
    if (userid === undefined) return;

    // only send friend request if user isn't already friends or hasn't already sent a friend request
    if (potentialFriend.status !== FriendStatus.NOT_FRIENDS && potentialFriend.status !== FriendStatus.INCOMING) return;

    // update the potential friend's status to pending
    potentialFriend.status = FriendStatus.OUTGOING;

    // trigger manual change detection to reflect the change in friend status
    this.cdr.detectChanges();

    // send friend request to server
    sendFriendRequest(userid, potentialFriend.userid).then((result) => {
      if (result.status === FriendStatus.OUTGOING) potentialFriend.status = FriendStatus.OUTGOING;
      else if (result.status === FriendStatus.FRIENDS) potentialFriend.status = FriendStatus.FRIENDS;
      this.cdr.detectChanges();
      this.friendsService.syncWithServer();
    });
  }

  ngOnDestroy() {
    this.visibilitySubscription.unsubscribe();
  }

}
