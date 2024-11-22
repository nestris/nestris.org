import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { FriendsService } from 'src/app/services/state/friends.service';
import { MeService } from 'src/app/services/state/me.service';
import { WebsocketService } from 'src/app/services/websocket.service';


@Component({
  selector: 'app-friend-page',
  templateUrl: './friend-page.component.html',
  styleUrls: ['./friend-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendPageComponent {

  readonly ButtonColor = ButtonColor;

  public showAddFriendDialog$ = new BehaviorSubject(false);

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

}
