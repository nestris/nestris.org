import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { FriendsService } from 'src/app/services/state/friends.service';
import { MeService } from 'src/app/services/state/me.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { FriendInfo } from 'src/app/shared/models/friends';

enum FriendSort {
  HIGHSCORE = 0,
  TROPHIES = 1,
  PUZZLE_ELO = 2,
}


@Component({
  selector: 'app-friend-page',
  templateUrl: './friend-page.component.html',
  styleUrls: ['./friend-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendPageComponent {

  readonly ButtonColor = ButtonColor;
  readonly FriendSort = FriendSort;

  public showAddFriendDialog$ = new BehaviorSubject(false);
  
  public friendSort$ = new BehaviorSubject<FriendSort>(FriendSort.HIGHSCORE);

  constructor(
    public friendsService: FriendsService,
    public websocketService: WebsocketService,
    public meService: MeService,
  ) {


  }

  // toggle the visibility of the add friend dialog
  toggleFriendDialog(event: MouseEvent) {


    this.showAddFriendDialog$.next(!this.showAddFriendDialog$.getValue());
    console.log(this.showAddFriendDialog$.getValue());
    event.stopPropagation(); // prevent the same click from closing the modal
  }

  /**
   * Sort the friends list based on the selected sort
   * @param friendsInfo The list of friends to sort
   * @param sort The sort to apply
   * @returns The sorted list of friends
   */
  sort(friendsInfo: FriendInfo[] | null, sort: FriendSort): FriendInfo[] {
    if (friendsInfo == null) return [];

    console.log("sorting friends", sort);

    return friendsInfo.sort((a, b) => {
      switch (sort) {
        case FriendSort.HIGHSCORE:
          return b.highestScore - a.highestScore;
        case FriendSort.TROPHIES:
          return b.trophies - a.trophies;
        case FriendSort.PUZZLE_ELO:
          return b.puzzleElo - a.puzzleElo;
      }
    });
  }

}
