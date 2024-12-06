import { Injectable } from '@angular/core';
import { distinctUntilChanged, filter, map, Observable } from 'rxjs';
import { FriendInfo } from '../../shared/models/friends';
import { FriendUpdateMessage, JsonMessageType } from '../../shared/network/json-message';
import { Method } from '../fetch.service';
import { StateService } from './state.service';


@Injectable({
  providedIn: 'root'
})
export class FriendsService extends StateService<FriendInfo[]>() {

  private arraysEqual(a: any[], b: any[]): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index]);
  }

  // Get the list of online friends as an observable
  public onlineFriends$ = this.get$().pipe(
    map(friendsInfo => friendsInfo.filter(friend => friend.isOnline).map(friend => friend.userid)),
    distinctUntilChanged(this.arraysEqual)
  );

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

  /**
   * Remove friend with given userid
   * @param userid The userid of the friend to remove
   */
  public async removeFriend(userid: string) {
    await this.fetchService.fetch(Method.POST, `/api/v2/remove-friend/${userid}`)
  }
}
