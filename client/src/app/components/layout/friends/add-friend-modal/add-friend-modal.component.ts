import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { FriendsService } from 'src/app/services/state/friends.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { FriendStatus, FriendInfo } from 'src/app/shared/models/friends';
import { DBUser } from 'src/app/shared/models/db-user';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { MeService } from 'src/app/services/state/me.service';

interface PotentialFriend {
  userid: string;
  username: string;
  friendStatus: FriendStatus;
}


@Component({
  selector: 'app-add-friend-modal',
  templateUrl: './add-friend-modal.component.html',
  styleUrls: ['./add-friend-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddFriendModalComponent implements OnInit, OnDestroy {
  @Input() visibility$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  public pattern = '';
  public potentialFriends$ = new BehaviorSubject<PotentialFriend[]>([]);

  readonly FriendStatus = FriendStatus;

  constructor(
    private fetchService: FetchService,
    private friendsService: FriendsService,
    ) {

    }

  async ngOnInit() {
    this.onPatternChange('');
  }

  /**
   * When the user types in the input field, update the potential friends list
   * @param event The input event
   */
  async onPatternChange(pattern: string) {

    const friends = await this.friendsService.get();

    // Fetch the users that match the typed username
    const users = await this.fetchService.fetch<{userid: string, username: string}[]>(Method.GET, `/api/v2/usernames-list/${pattern}`);
    console.log(pattern, users);
    // Update the potential friends list
    this.potentialFriends$.next(users.map(user => {
      return {
        userid: user.userid,
        username: user.username,
        friendStatus: friends.find(friend => friend.userid === user.userid) ? FriendStatus.FRIENDS : FriendStatus.NOT_FRIENDS
      }
    }));
  
  }

  // userMatchesTypedUsername(friend: PotentialFriend) {
  //   return false;
  //   //return friend.username.toLowerCase().includes(this.typedUsername.toLowerCase());
  // }

  ngOnDestroy() {
  }

}
