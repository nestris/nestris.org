import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Challenge } from '../../shared/models/challenge';
import { FriendInfo, OnlineUserStatus, FriendStatus } from '../../shared/models/friends';
import { JsonMessage, JsonMessageType } from '../../shared/network/json-message';
import { WebsocketService } from '../websocket.service';
import { FetchService, Method } from '../fetch.service';
import { StateService } from './state.service';


@Injectable({
  providedIn: 'root'
})
export class FriendsService extends StateService<FriendInfo[]> {

  constructor() {
    super([]);
  }

  protected override async fetch(): Promise<FriendInfo[]> {
    return await this.fetchService.fetch<FriendInfo[]>(Method.GET, `/api/v2/friends-info`);
  }

  // TODO: implement onEvent
  protected override onEvent(event: JsonMessage, state: FriendInfo[]): FriendInfo[] {
    return state;
  }

  // get the number of online friends as an observable
  public getNumOnlineFriends$(): Observable<number> {
    return this.get$().pipe(map(friendsInfo => friendsInfo.filter(friend => friend.onlineStatus !== OnlineUserStatus.OFFLINE).length));
  }

  // // sort by friend request type, then by online status, then lexigrapically
  // private sort(friendsInfo: FriendInfo[]): FriendInfo[] {
    
  //   // sort lexigraphically. A at the top, Z at the bottom
  //   friendsInfo.sort((a,b) => a.username < b.username ? -1 : 1);

  //   // sort by online status. Online at the top, offline at the bottom
  //   const onlinePriority = (status: OnlineUserStatus) => {
  //     switch (status) {
  //       case OnlineUserStatus.IDLE: return 0;
  //       case OnlineUserStatus.PLAYING: return 0;
  //       default: return 1;
  //     }
  //   }
  //   friendsInfo.sort((a,b) => onlinePriority(a.onlineStatus) - onlinePriority(b.onlineStatus));

  //   // sort by friend request type. Incoming at the top, the pending, then friends
  //   const friendPriority = (status: FriendStatus) => {
  //     switch (status) {
  //       case FriendStatus.INCOMING: return 0;
  //       case FriendStatus.OUTGOING: return 1;
  //       default: return 2;
  //     }
  //   }
  //   friendsInfo.sort((a,b) => friendPriority(a.friendStatus) - friendPriority(b.friendStatus));

  //   return friendsInfo;
  // }

}
