import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-friend-page',
  templateUrl: './friend-page.component.html',
  styleUrls: ['./friend-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendPageComponent {

  onClickAddFriend() {
    console.log("Add Friend clicked");
  }

}
