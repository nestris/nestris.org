import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { FriendsService } from 'src/app/services/friends.service';
import { WebsocketService } from 'src/app/services/websocket.service';


@Component({
  selector: 'app-friend-page',
  templateUrl: './friend-page.component.html',
  styleUrls: ['./friend-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendPageComponent implements OnDestroy {

  readonly ButtonColor = ButtonColor;

  public friendModalVisibility$ = new BehaviorSubject<boolean>(false);

  private onLoginSubscription: Subscription;

  constructor(
    public friendsService: FriendsService,
    public websocketService: WebsocketService
  ) {

    // If user logs in while on the friend page, sync the friends list with the server
    this.onLoginSubscription = this.websocketService.onSignIn().subscribe(() => {
      this.friendsService.syncWithServer();
    });
  }

  async ngOnInit() {
    this.friendsService.syncWithServer();
  }

  // opens the friend modal when the user clicks on the friend button
  toggleFriendModal(event: MouseEvent) {

    if (!this.websocketService.isSignedIn()) {
      return;
    }

    this.friendModalVisibility$.next(!this.friendModalVisibility$.getValue());
    event.stopPropagation(); // prevent the same click from closing the modal
  }

  ngOnDestroy() {
    this.onLoginSubscription.unsubscribe();
  }

}
