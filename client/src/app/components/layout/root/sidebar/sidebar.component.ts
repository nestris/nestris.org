import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { TabID } from 'client/src/app/models/tabs';
import { FriendService } from 'client/src/app/services/friend.service';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { OnlineUserStatus } from 'network-protocol/models/friends';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() isSignedIn!: boolean;

  readonly TabID = TabID;
  readonly OnlineUserStatus = OnlineUserStatus;

  constructor(
    public friendService: FriendService
  ) {}

}
