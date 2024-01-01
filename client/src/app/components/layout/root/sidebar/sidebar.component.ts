import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { TabID } from 'client/src/app/models/tabs';
import { WebsocketService } from 'client/src/app/services/websocket.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() isSignedIn!: boolean;

  readonly TabID = TabID;

}
