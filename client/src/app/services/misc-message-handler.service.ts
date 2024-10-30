import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { Router } from '@angular/router';

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

  }



}
