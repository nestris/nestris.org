import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FriendStatus } from '../add-friend-modal/add-friend-modal.component';

@Component({
  selector: 'app-friend-icon',
  templateUrl: './friend-icon.component.html',
  styleUrls: ['./friend-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendIconComponent {
  @Input() status: FriendStatus = FriendStatus.NOT_FRIENDS;

  readonly FriendStatus = FriendStatus;
}
