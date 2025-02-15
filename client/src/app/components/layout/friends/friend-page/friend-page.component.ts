import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { FriendsService } from 'src/app/services/state/friends.service';
import { InvitationsService } from 'src/app/services/state/invitations.service';
import { MeService } from 'src/app/services/state/me.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { LoginMethod } from 'src/app/shared/models/db-user';
import { FriendInfo } from 'src/app/shared/models/friends';
import { Invitation, InvitationType } from 'src/app/shared/models/invitation';

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
  readonly LoginMethod = LoginMethod;

  public showAddFriendDialog$ = new BehaviorSubject(false);
  
  public friendSort$ = new BehaviorSubject<FriendSort>(FriendSort.HIGHSCORE);
  
  public requests$ = this.invitationsService.getInvitationsOfType$(InvitationType.FRIEND_REQUEST);

  constructor(
    public friendsService: FriendsService,
    public websocketService: WebsocketService,
    public invitationsService: InvitationsService,
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
  sortFriends(friendsInfo: FriendInfo[] | null, sort: FriendSort): FriendInfo[] {
    if (friendsInfo == null) return [];

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

  /**
   * Sort first by incoming -> outgoing, then by the username
   * @param requests 
   */
  sortFriendRequests(requests: Invitation[] | null): Invitation[] {

    if (requests == null) return [];

    // Sort first by username
    requests.sort((a, b) => a.senderUsername.localeCompare(b.senderUsername));

    // Sort by incoming -> outgoing
    return requests.sort((a, b) => {
      if (a.receiverID === this.meService.getUserIDSync()) return -1;
      if (b.receiverID === this.meService.getUserIDSync()) return 1;
      return 0;
    });

  }

}
