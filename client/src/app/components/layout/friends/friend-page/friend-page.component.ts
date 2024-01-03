import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FriendService } from 'client/src/app/services/friend.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-friend-page',
  templateUrl: './friend-page.component.html',
  styleUrls: ['./friend-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendPageComponent {

  public friendModalVisibility$ = new BehaviorSubject<boolean>(false);

  constructor(
    public friendService: FriendService
  ) {
    friendService.onFriendsInfoUpdate().subscribe((friendsInfo) => {
      console.log("on friends info update");
    });
  }

  // opens the friend modal when the user clicks on the friend button
  toggleFriendModal(event: MouseEvent) {
    this.friendModalVisibility$.next(!this.friendModalVisibility$.getValue());
    event.stopPropagation(); // prevent the same click from closing the modal
  }

}
