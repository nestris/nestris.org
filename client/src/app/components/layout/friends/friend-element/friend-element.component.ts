import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FriendInfo } from 'network-protocol/models/friends';

@Component({
  selector: 'app-friend-element',
  templateUrl: './friend-element.component.html',
  styleUrls: ['./friend-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendElementComponent {
  @Input() friendInfo!: FriendInfo;
}
