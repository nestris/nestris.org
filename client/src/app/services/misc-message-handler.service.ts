import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { Router } from '@angular/router';
import { JsonMessageType, GoToRoomMessage } from '../shared/network/json-message';

/*
Handles miscellaneous JsonMessages from the server that don't fit into any other service
*/

@Injectable({
  providedIn: 'root'
})
export class MiscMessageHandlerService {

  constructor(
    private websocket: WebsocketService,
    private router: Router
  ) {

    websocket.onEvent(JsonMessageType.GO_TO_ROOM).subscribe((message) => this.goToRoom((message as GoToRoomMessage).roomID));
    
  }

  // go to the room with the given roomID
  private async goToRoom(roomID: string) {
    this.router.navigate(['/online/room'], { queryParams: { id: roomID } });
  }



}
