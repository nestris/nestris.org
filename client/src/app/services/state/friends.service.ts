import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, map, Observable } from 'rxjs';
import { FriendInfo } from '../../shared/models/friends';
import { FriendUpdateMessage, JsonMessageType } from '../../shared/network/json-message';
import { Method } from '../fetch.service';
import { StateService } from './state.service';
import { NotificationService } from '../notification.service';
import { MeService } from './me.service';
import { NotificationType } from 'src/app/shared/models/notifications';


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

  constructor(
    private readonly meService: MeService,
    private readonly notificationService: NotificationService
  ) {
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
      if (friendIndex !== -1) {
        const previousOnline = state[friendIndex].isOnline;
        state[friendIndex] = { ...state[friendIndex], ...event.data.update };
        const nowOnline = state[friendIndex].isOnline;
        if (previousOnline !== nowOnline) this.notifyUserOnline(state[friendIndex].username, nowOnline);
      }
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

  private userOnline$ = new Map<string, BehaviorSubject<boolean>>();
  private notifyUserOnline(username: string, online: boolean) {

    const notify = (isOnline: boolean) => {
      // Notify user that friend is online
      const type = isOnline ? NotificationType.SUCCESS : NotificationType.ERROR;
      const message = isOnline ? `${username} is now online!` : `${username} went offline.`;
      this.notificationService.notify(type, message);
    }

    // If friend online notification setting is disabled, do not notify
    if (!this.meService.getSync()?.notify_on_friend_online) return;

    // Debouncing online status for each user prevents things like screen refreshes from spamming changes in online status
    if (!this.userOnline$.has(username)) {
      const online$ = new BehaviorSubject<boolean>(online);
      this.userOnline$.set(username, online$);

      online$.pipe(
        debounceTime(2000),
        distinctUntilChanged(),
      ).subscribe(newOnline => notify(newOnline));
      return;
    }

    // If already exists, notify change
    this.userOnline$.get(username)!.next(online);
  }
}
