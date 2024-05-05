import { Injectable } from '@angular/core';
import { BinaryDecoder } from 'network-protocol/binary-codec';
import { JsonMessage, JsonMessageType, OnConnectMessage } from 'network-protocol/json-message';
import { MessageType, decodeMessage } from 'network-protocol/ws-message';
import { BehaviorSubject, Observable, Subject, filter, map } from 'rxjs';
import { NotificationService } from './notification.service';
import { NotificationType } from 'network-protocol/models/notifications';

/*
The central event bus for dealing with websocket messages to/from the server.
Use sendJsonMessage() to send a message to the server.
Subscribe to different message types using onEvent() to define handlers for different message types.

Also handles sign in, as the websocket connection is established when the user signs in and 
closed when the user signs out.
*/

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private ws?: WebSocket;
  private username?: string;

  private jsonEventSubject$ = new Subject<JsonMessage>();
  private binaryEventSubject$ = new Subject<BinaryDecoder>();

  private signedInSubject$ = new BehaviorSubject<boolean>(false);

  private hasSignedInBefore = false;

  constructor(
    private notificationService: NotificationService
  ) {

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

    this.onSignIn().subscribe(() => {
      this.hasSignedInBefore = true;
      this.notificationService.notify(NotificationType.SUCCESS, `Signed in as ${this.getUsername()}`)
    });

    this.onSignOut().subscribe(() => {
      if (this.hasSignedInBefore) this.notificationService.notify(NotificationType.ERROR, "You are now signed out");
  });

  }

  // observable emits true when signed in, false when signed out
  onSignInUpdate(): Observable<boolean> {
    return this.signedInSubject$.asObservable();
  }

  // subscribe to this observable when the user signs in
  onSignIn(): Observable<void> {
    return this.signedInSubject$.asObservable().pipe(
      filter((signedIn) => signedIn), // Continue only if signedIn is true
      map((signedIn) => undefined) // Transform the emitted value to 'undefined' (void)
    );
  }

  // subscribe to this observable when the user signs out
  // ignore first emitted value (false)
  onSignOut(): Observable<void> {
    return this.signedInSubject$.asObservable().pipe(
      filter((signedIn) => !signedIn), // Continue only if signedIn is false
      map((signedIn) => undefined) // Transform the emitted value to 'undefined' (void)
    );
  }

  // regular call to check whether the user is signed in
  isSignedIn(): boolean {
    return this.signedInSubject$.getValue();
  }

  // subscribe to this observable when a message is sent from server to client with matching type
  onEvent(event: JsonMessageType): Observable<JsonMessage> {
    return this.jsonEventSubject$.asObservable().pipe(
      filter((message) => message.type === event)
    );
  }

  // get the username of the signed in user, or undefined if not signed in
  getUsername(): string | undefined {
    if (!this.isSignedIn()) return undefined;
    return this.username;
  }

  // called when server sends a binary or json message to the client
  private onMessage(message: MessageEvent) {

    const { type, data } = decodeMessage(message.data);
    if (type === MessageType.JSON) {
      if ((data as JsonMessage).type !== JsonMessageType.PONG) console.log('Received JSON message:', data);
      this.jsonEventSubject$.next(data as JsonMessage);
    } else {
      // TODO: handle binary messages
    }
  }

  // send some json message to the server
  // subclass JsonMessage to define the message type and schema
  sendJsonMessage(message: JsonMessage) {
    if (message.type !== JsonMessageType.PING) console.log('Sending JSON message:', message);
    this.ws?.send(JSON.stringify(message));
  }

  sendBinaryMessage(message: Uint8Array) {
    console.log('Sending BINARY message:', message);
    this.ws?.send(message);
  }

  // called to connect to server
  // if the connection is successful, a ws connection is established and the user is signed in
  connect(username: string) {

    // if already signed in, do nothing
    if (this.isSignedIn()) {
      console.error('Cannot connect when already signed in');
      return;
    }

    this.username = username;

    const host = location.origin.replace(/^http/, 'ws');
    this.ws = new WebSocket(host);

    // when the websocket connects, send the OnConnectMessage to initiate the handshake
    this.ws.onopen = () => {
      console.log('Connected to the WebSocket server');
      this.sendJsonMessage(new OnConnectMessage(username));
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
