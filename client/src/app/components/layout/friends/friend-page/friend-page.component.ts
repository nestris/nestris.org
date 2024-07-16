import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { FriendsService } from 'src/app/services/friends.service';


@Component({
  selector: 'app-friend-page',
  templateUrl: './friend-page.component.html',
  styleUrls: ['./friend-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendPageComponent {

  readonly ButtonColor = ButtonColor;

  public friendModalVisibility$ = new BehaviorSubject<boolean>(false);


  constructor(
    public friendsService: FriendsService
  ) {

  }

  async ngOnInit() {
    this.friendsService.syncWithServer();
  }

  // opens the friend modal when the user clicks on the friend button
  toggleFriendModal(event: MouseEvent) {
    this.friendModalVisibility$.next(!this.friendModalVisibility$.getValue());
    event.stopPropagation(); // prevent the same click from closing the modal
  }

}
