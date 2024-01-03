import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Method, fetchServer } from 'client/src/app/scripts/fetch-server';
import { FriendService } from 'client/src/app/services/friend.service';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { SendFriendRequestMessage } from 'network-protocol/json-message';
import { FriendStatus } from 'network-protocol/models/friends';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

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
export class AddFriendModalComponent implements OnInit, OnDestroy {
  @Input() visibility$!: BehaviorSubject<boolean>;
  
  public typedUsername: string = "";
  public potentialFriends?: PotentialFriend[];

  private allUsernamesCache: string[] = [];

  constructor(
    private websocketService: WebsocketService,
    private friendService: FriendService,
    private cdr: ChangeDetectorRef
    ) {

  }

  ngOnInit(): void {

    // when modal is opened, sync usernames from server then update potential friends
    this.visibility$.subscribe(async (visible) => {
      if (visible) {
        await this.updateAllUsernamesCache();
        await this.updatePotentialFriends();
      }
    });

    // when user info is updated and modal is open, update potential friends
    this.friendService.onFriendsInfoUpdate().subscribe((friendsInfo) => {
      if (this.visibility$.getValue()) {
        this.updatePotentialFriends();
      }
    });

  }

  // update the list of all usernames from the server. should be called only on opening the modal
  async updateAllUsernamesCache() {
     
     const {status, content} = await fetchServer(Method.GET, '/api/all-usernames');
     if (status !== 200) {
       console.error("Could not get list of usernames");
       return;
     }
     this.allUsernamesCache = content.usernames;
  }

  /*
    Using the fetched global usernames list, compare with user's list of friends and
    see which ones are not already friends.
    Updates this.potentialFriends[]

    FUTURE CONSIDERATION: if this is too slow, consider delaying fetch until
    user has typed in a letter or two to user search, then only return the subset
    of usernames beginning with those letters
  */
  async updatePotentialFriends() {

    console.log("updating potential friends...");

    // block until friends info has been loaded
    const friendsInfo = await firstValueFrom(this.friendService.onFriendsInfoUpdate());

    console.log("friends info loaded");
    
    // compare the list of usernames with the user's friends list
    this.potentialFriends = [];
    this.allUsernamesCache.forEach((username: string) => {

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

    // only send friend request if user isn't already friends or hasn't already sent a friend request
    if (potentialFriend.status !== FriendStatus.NOT_FRIENDS && potentialFriend.status !== FriendStatus.INCOMING) return;

    // send friend request to server
    this.websocketService.sendJsonMessage(
      new SendFriendRequestMessage(potentialFriend.username)
    );

    // update the potential friend's status to pending
    potentialFriend.status = FriendStatus.PENDING;

    // trigger manual change detection to reflect the change in friend status
    this.cdr.detectChanges();

  }

  ngOnDestroy(): void {
    this.visibility$.complete();
  }



}
