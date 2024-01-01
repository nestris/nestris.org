import { Injectable } from '@angular/core';
import { BinaryDecoder } from 'network-protocol/binary-codec';
import { JsonMessage, JsonMessageType, OnConnectMessage } from 'network-protocol/json-message';
import { MessageType, decodeMessage } from 'network-protocol/ws-message';
import { BehaviorSubject, Observable, Subject, filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private ws?: WebSocket;

  private jsonEventSubject$ = new Subject<JsonMessage>();
  private binaryEventSubject$ = new Subject<BinaryDecoder>();

  private signedInSubject$ = new BehaviorSubject<boolean>(false);

  constructor() {

    /*
     Sign in requires a handshake that works as follows:
      1. Client establishes a websocket connection with the server
      2. Client sends a OnConnectMessage to server
      3. Server verifies the user session.
      4a. If the user session is valid, server sends a ConnectionSuccessfulMessage to client
      4b. If the user session is invalid, server closes the socket with an error code

     On ConnectionsSuccessfulMessage, the user is considered signed in.
    */
    this.onEvent(JsonMessageType.CONNECTION_SUCCESSFUL).subscribe((message) => {
      this.signedInSubject$.next(true);
    });

  }

  // when websocket connects, the user is signed in
  // when websocket disconnects, the user is signed out
  // subscribe to this observable to know when the user is signed in
  onSignInUpdate(): Observable<boolean> {
    return this.signedInSubject$.asObservable();
  }

  // regular call to check whether the user is signed in
  isSignedIn(): boolean {
    return this.signedInSubject$.getValue();
  }

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

  // called to connect to server
  // if the connection is successful, a ws connection is established and the user is signed in
  connect(username: string, gmail: string) {

    // if already signed in, do nothing
    if (this.isSignedIn()) {
      console.error('Cannot connect when already signed in');
      return;
    }

    const host = location.origin.replace(/^http/, 'ws');
    this.ws = new WebSocket(host);

    // when the websocket connects, send the OnConnectMessage to initiate the handshake
    this.ws.onopen = () => {
      console.log('Connected to the WebSocket server');
      this.sendJsonMessage(new OnConnectMessage(username, gmail));
    };
    
    // pipe messages to onEvent observables
    this.ws.onmessage = (event) => {
      this.onMessage(event);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    this.ws.onclose = (event) => {
      console.log(`WebSocket closed: ${event.code} ${event.reason}`);

      // if the websocket closes, sign out the user
      if (this.isSignedIn()) {
        this.signedInSubject$.next(false);
      }
    };
  }

  // called to disconnect from server. this will trigger the onclose event
  // and thus sign out the user
  disconnect() {
    this.ws?.close();
  }

}
