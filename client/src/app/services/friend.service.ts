import { Injectable } from '@angular/core';
import { FriendInfo, FriendStatus, OnlineUserStatus } from 'network-protocol/models/friends';
import { BehaviorSubject, Observable, filter, map } from 'rxjs';
import { getFriendInfoFromServer } from '../scripts/fetch-user';
import { WebsocketService } from './websocket.service';
import { NotificationService, NotificationType } from './notification.service';
import { FriendOnlineStatusChange, JsonMessageType, OnFriendRequestAcceptedMessage, OnSendFriendRequestMessage, SendFriendRequestMessage } from 'network-protocol/json-message';

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
  This is expensive. prefer to modify it on change events instead of completely redownloading every time
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

  // subscribe to a count of the number of online friends
  onNumOnlineFriendsUpdate(): Observable<number> {
    return this.onFriendsInfoUpdate().pipe(
      map( // Transform the emitted value to the count of online friends
        (friendsInfo) => (
          friendsInfo.filter((friendInfo) => friendInfo.onlineStatus !== OnlineUserStatus.OFFLINE) // filter to only online friends
        ).length // count number of online friends
      )
    );
  }

  constructor(
    private websocketService: WebsocketService,
    private notificationService: NotificationService
  ) {

    // when the user signs in, get friend data from server
    this.websocketService.onSignIn().subscribe(() => {
      this.syncWithServer();
    });

    // when it's confirmed by the server that the user sent a friend request, update cache
    this.websocketService.onEvent(JsonMessageType.ON_SEND_FRIEND_REQUEST).subscribe((message) => {

      const friendInfo = (message as OnSendFriendRequestMessage).friendInfo;
      this.addFriend(friendInfo);
    });

    // when a friend request is accepted, notify the user
    this.websocketService.onEvent(JsonMessageType.ON_FRIEND_REQUEST_ACCEPTED).subscribe((message) => {
      const newFriend = (message as OnFriendRequestAcceptedMessage).newFriend;
      this.notificationService.notify(NotificationType.SUCCESS, `You are now friends with ${newFriend}!`);

      // update friends cache to change friend status to FriendStatus.FRIENDS
      const friendInfo = this.getFriendInfo(newFriend);
      if (friendInfo !== undefined) {
        friendInfo.friendStatus = FriendStatus.FRIENDS;
        this.modifyFriend(friendInfo);
      }
    });

    // when a friend request is declined, notify the user
    this.websocketService.onEvent(JsonMessageType.ON_FRIEND_REQUEST_DECLINED).subscribe((message) => {
      const newFriend = (message as OnFriendRequestAcceptedMessage).newFriend;
      this.notificationService.notify(NotificationType.ERROR, `${newFriend} declined your friend request.`);

      // delete friend from friend cache
      this.deleteFriend(newFriend);

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

        // update friend info
        friendInfo.onlineStatus = statusChange.status;
        this.modifyFriend(friendInfo);
      }
    });
  }

  // get the friend info for a given username, if it exists
  getFriendInfo(username: string): FriendInfo | undefined {
    if (this.friendsInfo.value === undefined) return undefined;
    return this.friendsInfo.value.find((friendInfo) => friendInfo.username === username);
  }

  private addFriend(friendInfo: FriendInfo) {

    if (this.friendsInfo.value === undefined) return;

    // make sure friend does not exist
    if (this.getFriendInfo(friendInfo.username) !== undefined) {
      throw new Error(`Cannot add friend; ${friendInfo.username} already exists`);
    }

    const newFriendsInfo = this.friendsInfo.value.map((i) => i);
    newFriendsInfo.push(friendInfo);

    // emit new value    
    this.friendsInfo.next(newFriendsInfo);
    console.log("addFriend:", this.friendsInfo.value);

  }

  // delete a friend and emit new value
  private deleteFriend(username: string) {

    if (this.friendsInfo.value === undefined) return;

    // make sure friend already exists
    if (this.getFriendInfo(username) === undefined) {
      throw new Error("Cannot delete friend: " + username + "doesn't exist in cache");
    }

    // delete friend
    const newFriendsInfo = this.friendsInfo.value.filter((friendInfo) => friendInfo.username !== username);

    // emit new value    
    this.friendsInfo.next(newFriendsInfo);
    console.log("deleteFriend:", this.friendsInfo.value);
  }

  // we make a shallow copy, remove old friendInfo, and and update new one
  // so that angular change detection works
  private modifyFriend(modifiedFriendInfo: FriendInfo) {

    if (this.friendsInfo.value === undefined) return;
    
    // make sure friend already exists
    if (this.getFriendInfo(modifiedFriendInfo.username) === undefined) {
      throw new Error("Cannot modify friend; " + modifiedFriendInfo.username + "doesn't exist in cache");
    }

    // replace friend info and make shallow copy
    const newFriendsInfo = this.friendsInfo.value.filter((friendInfo) => friendInfo.username !== modifiedFriendInfo.username);
    newFriendsInfo.push(new FriendInfo(
      modifiedFriendInfo.username,
      modifiedFriendInfo.friendStatus,
      modifiedFriendInfo.onlineStatus,
      modifiedFriendInfo.xp,
      modifiedFriendInfo.trophies
    ));
    
    // emit new value    
    this.friendsInfo.next(newFriendsInfo);
    console.log("modifyFriend:", this.friendsInfo.value);
  }

}
