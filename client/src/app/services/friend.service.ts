import { Injectable } from '@angular/core';
import { FriendInfo, OnlineUserStatus } from 'network-protocol/models/friends';
import { BehaviorSubject, Observable, filter } from 'rxjs';
import { getFriendInfoFromServer } from '../scripts/fetch-user';
import { WebsocketService } from './websocket.service';
import { NotificationService, NotificationType } from './notification.service';
import { FriendOnlineStatusChange, JsonMessageType, OnFriendRequestAcceptedMessage, SendFriendRequestMessage } from 'network-protocol/json-message';

/*
  Handles downloading friend data for logged in user from server
*/

@Injectable({
  providedIn: 'root'
})
export class FriendService {

  private friendsInfo = new BehaviorSubject<FriendInfo[] | undefined>(undefined);

  /*
  Call this function to fetch current friend data
  Send GET request to server to get user info for the logged in user
  update friendInfo subject when received
  */
  async syncWithServer() {

    console.log("Syncing friends info with server");

    const myUsername = this.websocketService.getUsername()!;
    const friendsInfo = await getFriendInfoFromServer(myUsername);
    if (!friendsInfo) {
      console.error("Could not get user info for ", myUsername);
      return;
    }

    this.friendsInfo.next(friendsInfo);

  }

  // subscribe to this observable when the friends info is updated. it is guaranteed to emit a non-undefined value.
  onFriendsInfoUpdate(): Observable<FriendInfo[]> {
    return this.friendsInfo.asObservable().pipe(
        // Filter out 'undefined' values.
        filter((friendInfo: FriendInfo[] | undefined): friendInfo is FriendInfo[] => friendInfo !== undefined)
    );
}

  // regular call to get user info. may be undefined until syncWithServer() is called and a response is received.
  // to make a blocking call with a guaranteed non-undefined value, pipe onUserInfoUpdate() observable with first()
  getFriendsInfo(): FriendInfo[] | undefined {
    return this.friendsInfo.getValue();
  }

  constructor(
    private websocketService: WebsocketService,
    private notificationService: NotificationService
  ) {

    // when the user signs in, get friend data from server
    this.websocketService.onSignIn().subscribe(() => {
      this.syncWithServer();
    });

    // when a friend request is accepted, notify the user
    this.websocketService.onEvent(JsonMessageType.ON_FRIEND_REQUEST_ACCEPTED).subscribe((message) => {
      const newFriend = (message as OnFriendRequestAcceptedMessage).newFriend;
      this.notificationService.notify(NotificationType.SUCCESS, `You are now friends with ${newFriend}!`);
      this.syncWithServer(); // TODO: do not refetch and modify cache instead
    });

    // when someone sends a friend request, notify the user
    this.websocketService.onEvent(JsonMessageType.SEND_FRIEND_REQUEST).subscribe((message) => {
      const potentialFriend = (message as SendFriendRequestMessage).potentialFriend;
      this.notificationService.notify(NotificationType.SUCCESS, `${potentialFriend} sent you a friend request!`);
      this.syncWithServer(); // TODO: message should include user info, and modify cache instead of refetch
    });

    // when a friend's online status has changed, no need to resync with server,
    // but can instead just update that friend's status
    this.websocketService.onEvent(JsonMessageType.FRIEND_ONLINE_STATUS_CHANGE).subscribe((message) => {
      if (this.friendsInfo.value !== undefined) { // only relevant if there's existing cached friends info to modify
        const statusChange = (message as FriendOnlineStatusChange);

        // find the relevant friend in the friends info cache
        const friendInfo = this.friendsInfo.value.find((friendInfo) => friendInfo.username === statusChange.friendUsername);
        if (friendInfo === undefined) {
          console.error(statusChange.friendUsername, " not found in cache");
          return;
        }

        console.log(friendInfo.username, "was", friendInfo.onlineStatus);

        // if went from offline -> online, send green "went online" notification
        if (friendInfo.onlineStatus === OnlineUserStatus.OFFLINE && statusChange.status !== OnlineUserStatus.OFFLINE) {
          this.notificationService.notify(NotificationType.SUCCESS, `${friendInfo.username} is now online!`);
        }

        // if went from online -> offline, send red "went offline" notification
        if (friendInfo.onlineStatus !== OnlineUserStatus.OFFLINE && statusChange.status === OnlineUserStatus.OFFLINE) {
          this.notificationService.notify(NotificationType.ERROR, `${friendInfo.username} went offline`);
        }

        // update online status. instead of modifying the relevant friendInfo directly,
        // we make a shallow copy, remove old friendInfo, and and update new one
        // so that angular change detection works
        const newFriendInfo = new FriendInfo(
          friendInfo.username,
          friendInfo.friendStatus,
          statusChange.status,
          friendInfo.trophies,
          friendInfo.xp
        );
        const newFriendsInfo = this.friendsInfo.value.filter((friendInfo) => friendInfo.username !== statusChange.friendUsername);
        newFriendsInfo.push(newFriendInfo);

        this.friendsInfo.next(newFriendsInfo);
        console.log("updated", friendInfo.username, "to", friendInfo.onlineStatus);
      }
    });

  }
}
