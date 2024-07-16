import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FriendStatus } from 'src/app/shared/models/friends';

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
