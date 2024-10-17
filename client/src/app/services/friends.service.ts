import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Challenge } from '../shared/models/challenge';
import { FriendInfo, OnlineUserStatus, FriendStatus } from '../shared/models/friends';
import { JsonMessageType } from '../shared/network/json-message';
import { WebsocketService } from './websocket.service';
import { FetchService, Method } from './fetch.service';


@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  private friendsInfo$ = new BehaviorSubject<FriendInfo[]>([]);
  private challenges$ = new BehaviorSubject<Challenge[]>([]);

  constructor(
    private fetchService: FetchService,
    private websocketService: WebsocketService,
  ) {

    this.syncWithServer();

  }

  getFriendsInfo$(): Observable<FriendInfo[]> {
    return this.friendsInfo$.asObservable();
  }

  getChallenges$(): Observable<Challenge[]> {
    return this.challenges$.asObservable();
  }

  async syncWithServer() {

    const friendsInfo = await this.fetchService.fetch<FriendInfo[]>(Method.GET, `/api/v2/friends-info`);
    
    // sort friendsInfo and update friendsInfo$
    this.friendsInfo$.next(this.sort(friendsInfo));

    // extract the list of challenges from this.friendsInfo$ and update this.challenges$
    this.challenges$.next(
      this.friendsInfo$.getValue().filter( // get all the FriendInfo with challenges
        (friendInfo) => friendInfo.challenge !== undefined
      ).map( // convert to Challenge[]
        (friendInfo) => friendInfo.challenge!
      )
    );
  }

  // sort by friend request type, then by online status, then lexigrapically
  private sort(friendsInfo: FriendInfo[]): FriendInfo[] {
    
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
