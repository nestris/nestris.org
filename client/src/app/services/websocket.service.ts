import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  constructor() { }

  connect() {

    const host = location.origin.replace(/^http/, 'ws');
    const ws = new WebSocket(host);

    ws.onopen = function() {
      console.log('Connected to the WebSocket server');
      ws.send('Hello from the client!');
    };
    
    ws.onmessage = function(event) {
      console.log('Message from server:', event.data);
    };
    
    ws.onerror = function(error) {
      console.error('WebSocket Error:', error);
    };

  }

}
