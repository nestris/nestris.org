import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WebsocketService } from './websocket.service';
import { FetchService, Method } from './fetch.service';
import { JsonMessageType } from '../shared/network/json-message';
import { FriendOnlineStatusChangeMessage } from '../shared/network/json-messages/friend-online-status-change-message';

/**
 * Handles friends going online and offline by subscribing to FriendOnlineStatusChangeMessages.
 * Displays online/offline notifications, and maintains a count of online friends
 */

@Injectable({
  providedIn: 'root'
})
export class OnlineFriendsService {

  private onlineFriendCount$ = new BehaviorSubject<number>(0);

  constructor(
    private fetchService: FetchService,
    private websocketService: WebsocketService
  ) {

    this.websocketService.onEvent<FriendOnlineStatusChangeMessage>(JsonMessageType.FRIEND_ONLINE_STATUS_CHANGE).subscribe((event) => {
      this.syncOnlineFriendCount();
    });

    this.syncOnlineFriendCount();

  }

  async syncOnlineFriendCount() {
    const response = await this.fetchService.fetch<{count : number}>(Method.GET, '/api/v2/online-friend-count');
    this.onlineFriendCount$.next(response.count);
  }

  getOnlineFriendCount$(): Observable<number> {
    return this.onlineFriendCount$.asObservable();
  }

}
