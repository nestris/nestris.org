import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { fetchServer, Method } from 'src/app/scripts/fetch-server';
import { FriendsService } from 'src/app/services/friends.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { FriendStatus, FriendInfo } from 'src/app/shared/models/friends';
import { sendFriendRequest } from '../friend-util';


export interface PotentialFriend {
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

  private allUsernames: string[] = [];

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
    const {status, content} = await fetchServer(Method.GET, '/api/v2/all-usernames');
     if (status !== 200) {
       console.error("Could not get list of usernames");
       return;
     }
     this.allUsernames = content as string[];
  }

  /*
    Using the fetched global usernames list, compare with user's list of friends and
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
    const myUsername = this.websocketService.getUsername();
    this.potentialFriends = [];
    this.allUsernames.forEach((username: string) => {

      // do not show myself in list
      if (username === myUsername) return;

      let status = FriendStatus.NOT_FRIENDS;
      const friend = friendsInfo.find((friendInfo) => friendInfo.username === username); // find matching username on friends list, if any
      if (friend !== undefined) status = friend.friendStatus;

      this.potentialFriends!.push({
        username: username,
        status: status
      });
    });

    // trigger manual change detection to reflect the change in potential friends
    this.cdr.detectChanges();
  }

  // called when user clicks on a potential friend "add friend" icon
  sendFriendRequest(potentialFriend: PotentialFriend) {
    
    const username = this.websocketService.getUsername();
    if (username === undefined) return;

    // only send friend request if user isn't already friends or hasn't already sent a friend request
    if (potentialFriend.status !== FriendStatus.NOT_FRIENDS && potentialFriend.status !== FriendStatus.INCOMING) return;

    // update the potential friend's status to pending
    potentialFriend.status = FriendStatus.OUTGOING;

    // trigger manual change detection to reflect the change in friend status
    this.cdr.detectChanges();

    // send friend request to server
    sendFriendRequest(username, potentialFriend.username).then((result) => {
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