import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Challenge } from '../../shared/models/challenge';
import { FriendInfo, FriendStatus } from '../../shared/models/friends';
import { FriendUpdateMessage, JsonMessage, JsonMessageType } from '../../shared/network/json-message';
import { WebsocketService } from '../websocket.service';
import { FetchService, Method } from '../fetch.service';
import { StateService } from './state.service';


@Injectable({
  providedIn: 'root'
})
export class FriendsService extends StateService<FriendInfo[]>() {

  constructor() {
    super([JsonMessageType.FRIEND_UPDATE], "Friends");
  }

  protected override async fetch(): Promise<FriendInfo[]> {
    return await this.fetchService.fetch<FriendInfo[]>(Method.GET, `/api/v2/friends-info`);
  }

  // Update the friend list when a friend update message is received
  protected override onEvent(event: FriendUpdateMessage, state: FriendInfo[]): FriendInfo[] {

    if (event.data.create) { // If a new friend was added, add friend
      state.push(event.data.create);

    } else if (event.data.update) { // If an existing friend was updated, replace specified properties
    
      const friendIndex = state.findIndex(friend => friend.userid === event.userid);
      if (friendIndex !== -1) state[friendIndex] = { ...state[friendIndex], ...event.data.update };
    }

    else { // If a friend was removed, remove friend
      state = state.filter(friend => friend.userid !== event.userid);
    }

    return state;
  }

  // get the number of online friends as an observable
  public getNumOnlineFriends$(): Observable<number> {
    return this.get$().pipe(map(friendsInfo => friendsInfo.filter(friend => friend.isOnline).length));
  }
}
