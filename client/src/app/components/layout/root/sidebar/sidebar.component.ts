import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { TabID } from 'client/src/app/models/tabs';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { OnlineUserStatus } from 'network-protocol/models/friends';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { ModalManagerService, ModalType } from 'client/src/app/services/modal-manager.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  readonly TabID = TabID;
  readonly OnlineUserStatus = OnlineUserStatus;
  readonly ButtonColor = ButtonColor;

  public numOnlineFriends = 0;

  constructor(
    public websocketService: WebsocketService,
    public modalService: ModalManagerService
  ) {}

  async ngOnInit() {

    //const response = await fetch(`/api/v2/num-online-friends/${this.username}`);
    
  }

  openAuthModal(): void {
    this.modalService.showModal(ModalType.AUTH);
  }

}
