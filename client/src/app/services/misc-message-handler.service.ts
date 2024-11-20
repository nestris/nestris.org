import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { Router } from '@angular/router';
import { JsonMessageType, RedirectMessage } from '../shared/network/json-message';

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

    this.websocket.onEvent<RedirectMessage>(JsonMessageType.REDIRECT).subscribe((message) => {
      this.router.navigate([message.route]);
    });

  }



}
