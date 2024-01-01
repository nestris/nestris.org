import { Injectable } from '@angular/core';
import { BinaryDecoder } from 'network-protocol/binary-codec';
import { JsonMessage, JsonMessageType, OnConnectMessage } from 'network-protocol/json-message';
import { MessageType, decodeMessage } from 'network-protocol/ws-message';
import { Observable, Subject, filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private ws?: WebSocket;

  private jsonEventSubject$ = new Subject<JsonMessage>();
  private binaryEventSubject$ = new Subject<BinaryDecoder>();

  constructor() { }

  // subscribe to this observable for the given message type
  onEvent(event: JsonMessageType): Observable<JsonMessage> {
    return this.jsonEventSubject$.asObservable().pipe(
      filter((message) => message.type === event)
    );
  }

  // called when server sends a binary or json message to the client
  private onMessage(message: MessageEvent) {

    const { type, data } = decodeMessage(message.data);
    if (type === MessageType.JSON) {
      console.log('Received JSON message:', data);
      this.jsonEventSubject$.next(data as JsonMessage);
    } else {
      console.log('Received BINARY message:', (data as BinaryDecoder).bits);
      this.binaryEventSubject$.next(data as BinaryDecoder);
    }
  }

  sendJsonMessage(message: JsonMessage) {
    console.log('Sending JSON message:', message);
    this.ws?.send(JSON.stringify(message));
  } 

  // called to connect to server and as a logged in user
  connect(username: string, gmail: string) {

    const host = location.origin.replace(/^http/, 'ws');
    this.ws = new WebSocket(host);

    this.ws.onopen = () => {
      console.log('Connected to the WebSocket server');
      this.sendJsonMessage(new OnConnectMessage(username, gmail));
    };
    
    this.ws.onmessage = (event) => {
      this.onMessage(event);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    this.ws.onclose = (event) => {
      console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    };
  }

  disconnect() {
    this.ws?.close();
  }


}
