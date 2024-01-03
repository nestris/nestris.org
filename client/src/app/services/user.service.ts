import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { JsonMessageType, OnFriendRequestAcceptedMessage, SendFriendRequestMessage } from 'network-protocol/json-message';
import { NotificationService, NotificationType } from './notification.service';
import { BehaviorSubject, Observable, filter, first } from 'rxjs';
import { IUserSchema } from 'server/database/user/user-schema';
import { getUserInfoFromServer } from '../scripts/fetch-user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userInfo = new BehaviorSubject<IUserSchema | undefined>(undefined);

  async syncWithServer() {

    console.log("Syncing user info with server");

    const myUsername = this.websocketService.getUsername()!;
    const userInfo = await getUserInfoFromServer(myUsername);
    if (!userInfo) {
      console.error("Could not get user info for ", myUsername);
      return;
    }

    this.userInfo.next(userInfo);

  }

  // subscribe to this observable when the user info is updated. it is guaranteed to emit a non-undefined value.
  onUserInfoUpdate(): Observable<IUserSchema> {
    return this.userInfo.asObservable().pipe(
        // Filter out 'undefined' values.
        filter((userInfo: IUserSchema | undefined): userInfo is IUserSchema => userInfo !== undefined)
    );
}

  getUserInfo(): IUserSchema | undefined {
    return this.userInfo.getValue();
  }

  constructor(
    private websocketService: WebsocketService,
    private notificationService: NotificationService
  ) {

    // when the user signs in, get user data from server
    this.websocketService.onSignIn().subscribe(() => {
      this.syncWithServer();
    });

    // when a friend request is accepted, notify the user
    this.websocketService.onEvent(JsonMessageType.ON_FRIEND_REQUEST_ACCEPTED).subscribe((message) => {
      const newFriend = (message as OnFriendRequestAcceptedMessage).newFriend;
      this.notificationService.notify(NotificationType.SUCCESS, `You are now friends with ${newFriend}!`);
      this.syncWithServer();
    });

    // when someone sends a friend request, notify the user
    this.websocketService.onEvent(JsonMessageType.SEND_FRIEND_REQUEST).subscribe((message) => {
      const potentialFriend = (message as SendFriendRequestMessage).potentialFriend;
      this.notificationService.notify(NotificationType.SUCCESS, `${potentialFriend} sent you a friend request!`);
      this.syncWithServer();
    });
  }
}
