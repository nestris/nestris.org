import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FriendService } from 'client/src/app/services/friend.service';
import { BehaviorSubject } from 'rxjs';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { SidebarTabService } from 'client/src/app/services/sidebar-tab.service';
import { TabID } from 'client/src/app/models/tabs';

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
    public friendService: FriendService,
    public tabService: SidebarTabService
  ) {

    // resync friends data (specifically, xp and trophies) when switching to friends tab
    // stuff like online status should already be updated through events
    tabService.onSwitchToTab(TabID.FRIENDS).subscribe(() => {
      this.friendService.syncWithServer();
    });

  }

  // opens the friend modal when the user clicks on the friend button
  toggleFriendModal(event: MouseEvent) {
    this.friendModalVisibility$.next(!this.friendModalVisibility$.getValue());
    event.stopPropagation(); // prevent the same click from closing the modal
  }

}
