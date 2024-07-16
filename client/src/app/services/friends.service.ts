import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { fetchServer, Method } from '../scripts/fetch-server';
import { Challenge } from '../shared/models/challenge';
import { FriendInfo, OnlineUserStatus, FriendStatus } from '../shared/models/friends';
import { JsonMessageType } from '../shared/network/json-message';
import { WebsocketService } from './websocket.service';


@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  private friendsInfo$ = new BehaviorSubject<FriendInfo[]>([]);
  private challenges$ = new BehaviorSubject<Challenge[]>([]);

  constructor(
    private websocketService: WebsocketService,
  ) {

    // whenever receiving an update online friends message, sync with server
    this.websocketService.onEvent(JsonMessageType.UPDATE_ONLINE_FRIENDS).subscribe(() => {
      this.syncWithServer();
    });

  }

  getFriendsInfo$(): Observable<FriendInfo[]> {
    return this.friendsInfo$.asObservable();
  }

  getChallenges$(): Observable<Challenge[]> {
    return this.challenges$.asObservable();
  }

  async syncWithServer() {

    const username = this.websocketService.getUsername();
    if (!username) return; // if not logged in, do nothing

    const {status, content} = await fetchServer(Method.GET, `/api/v2/friends/${username}`);
    if (status >= 400) return; 
    
    // sort friendsInfo and update friendsInfo$
    const friendsInfo = content as FriendInfo[];
    this.friendsInfo$.next(this.sort(friendsInfo));

    // extract the list of challenges from this.friendsInfo$ and update this.challenges$
    this.challenges$.next(
      this.friendsInfo$.getValue().filter( // get all the FriendInfo with challenges
        (friendInfo) => friendInfo.challenge !== undefined
      ).map( // convert to Challenge[]
        (friendInfo) => friendInfo.challenge!
      )
    );
    console.log("Challenges", this.challenges$.getValue());
  }

  // sort by friend request type, then by online status, then lexigrapically
  sort(friendsInfo: FriendInfo[]): FriendInfo[] {
    
    // sort lexigraphically. A at the top, Z at the bottom
    friendsInfo.sort((a,b) => a.username < b.username ? -1 : 1);

    // sort by online status. Online at the top, offline at the bottom
    const onlinePriority = (status: OnlineUserStatus) => {
      switch (status) {
        case OnlineUserStatus.IDLE: return 0;
        case OnlineUserStatus.PLAYING: return 0;
        default: return 1;
      }
    }
    friendsInfo.sort((a,b) => onlinePriority(a.onlineStatus) - onlinePriority(b.onlineStatus));

    // sort by friend request type. Incoming at the top, the pending, then friends
    const friendPriority = (status: FriendStatus) => {
      switch (status) {
        case FriendStatus.INCOMING: return 0;
        case FriendStatus.OUTGOING: return 1;
        default: return 2;
      }
    }
    friendsInfo.sort((a,b) => friendPriority(a.friendStatus) - friendPriority(b.friendStatus));

    return friendsInfo;
  }

}
