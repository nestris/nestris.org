import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Method, fetchServer } from 'client/src/app/scripts/fetch-server';
import { getUserInfoFromServer } from 'client/src/app/scripts/fetch-user';
import { UserService } from 'client/src/app/services/user.service';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { SendFriendRequestMessage } from 'network-protocol/json-message';
import { BehaviorSubject, first, firstValueFrom } from 'rxjs';

export enum FriendStatus {
  FRIENDS = "Friends",
  PENDING = "Pending",
  INCOMING = "Incoming",
  NOT_FRIENDS = "Not Friends"
}

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
    private userService: UserService,
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
    this.userService.onUserInfoUpdate().subscribe((userInfo) => {
      if (this.visibility$.getValue()) {
        this.updatePotentialFriends();
      }
    });

  }

  // update the list of usernames from the server
  async updateAllUsernamesCache() {
     
     const {status, content} = await fetchServer(Method.GET, '/api/all-usernames');
     if (status !== 200) {
       console.error("Could not get list of usernames");
       return;
     }
     this.allUsernamesCache = content.usernames;
  }

  /*
    Get the list of usernames from the server.
    Compare with user's list of friends and see which ones are not already friends.
  */
  async updatePotentialFriends() {

    // get the first value from the observable
    this.userService.onUserInfoUpdate().pipe(first()).subscribe((myInfo) => {
      console.log("myInfo", myInfo);

      // compare the list of usernames with the user's friends list
      this.potentialFriends = [];
      this.allUsernamesCache.forEach((username: string) => {

        let status = FriendStatus.NOT_FRIENDS;
        if (username === myInfo.username) { // don't show yourself
          return;
        } else if (myInfo.friends.includes(username)) { // friends
          status = FriendStatus.FRIENDS;
        } else if (myInfo.outgoingFriendRequests.includes(username)) { // outgoing friend requests
          status = FriendStatus.PENDING;
        } else if (myInfo.incomingFriendRequests.includes(username)) { // incoming friend requests
          status = FriendStatus.INCOMING;
        }

        this.potentialFriends!.push({
          username: username,
          status: status
        });
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
