import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import { BehaviorSubject, Observable, Subject, filter, map } from 'rxjs';
import { NotificationType } from '../shared/models/notifications';
import { JsonMessage, JsonMessageType, OnConnectMessage } from '../shared/network/json-message';
import { PacketGroup, PacketContent } from '../shared/network/stream-packets/packet';
import { PacketDisassembler } from '../shared/network/stream-packets/packet-disassembler';
import { decodeMessage, MessageType } from '../shared/network/ws-message';
import { NotificationService } from './notification.service';
import { fetchServer2, Method } from '../scripts/fetch-server';
import { DBUser } from '../shared/models/db-user';


/*
The central event bus for dealing with websocket messages to/from the server.
Use sendJsonMessage() to send a message to the server.
Subscribe to different message types using onEvent() to define handlers for different message types.

Also handles sign in, as the websocket connection is established when the user signs in and 
closed when the user signs out.
*/

const NON_AUTH_WEBPAGES = ['/login', '/not-on-whitelist'];

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private ws?: WebSocket;
  private user$ = new BehaviorSubject<DBUser | undefined>(undefined);
  private sessionID?: string;

  private jsonEvent$ = new Subject<JsonMessage>();
  private packetGroup$ = new Subject<PacketGroup>();

  private signedInSubject$ = new BehaviorSubject<boolean>(false);

  private hasSignedInBefore = false;

  private isGuest = false;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {
    
    // Check if logged in. If not, direct to login page
    fetchServer2<DBUser>(Method.GET, '/api/v2/me').then((response) => {
      this.user$.next(response);

      // if the user is already signed in, connect to the websocket
      console.log("Logged in. Connecting to websocket...")
      notificationService.notify(NotificationType.INFO, "Connecting to server...");
      this.connectWebsocket();
    }).catch((error) => {
      // If not signed in, redirect to login page with hard refresh if we were on an authenticated page
      if (!NON_AUTH_WEBPAGES.includes(location.pathname)) location.href = '/login';
      console.error('Not signed in:', error);
    });

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
      this.notificationService.notify(NotificationType.SUCCESS, `Logged in as ${this.getUsername()}`)
    });

    this.onSignOut().subscribe(() => {
      if (this.hasSignedInBefore) {
        // redirect to home page
        this.router.navigate(['/']);

        this.notificationService.notify(NotificationType.ERROR, "You are now signed out");
      }
    });
  }

  // Call this function to login with discord
  login() {

    // After discord login, redirect to this callback URL in the server to process the code
    let baseURL = window.location.origin;
    // remove port number if it exists
    if (baseURL.split(":").length > 1) baseURL = baseURL.slice(0, baseURL.lastIndexOf(":"));
    // const redirectUri = encodeURIComponent(baseURL + '/api/v2/callback');
    const redirectUri = encodeURIComponent(window.location.origin + '/api/v2/callback');

    // Redirect to discord login page. Hard refresh to avoid CORS issues
    location.href = `api/v2/login?redirectUri=${redirectUri}`;
  }

  setGuestUser() {
    this.isGuest = true;
    this.router.navigate(['/play']);
  }

  isGuestUser() {
    return this.isGuest;
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
    return this.jsonEvent$.asObservable().pipe(
      filter((message) => message.type === event)
    );
  }

  onPacketGroup(): Observable<PacketGroup> {
    return this.packetGroup$.asObservable();
  }

  // get the username of the signed in user, or undefined if not signed in
  getUsername(): string | undefined {
    return this.user$.getValue()?.username;
  }

  // get the userid of the signed in user, or undefined if not signed in
  getUserID(): string | undefined {
    return this.user$.getValue()?.userid;
  }

  getUser(): DBUser | undefined {
    return this.user$.getValue();
  }

  getUser$(): Observable<DBUser | undefined> {
    return this.user$.asObservable();
  }

  getSessionID(): string | undefined {
    return this.sessionID;
  }

  // call /me endpoint to get and update user info
  async syncMyself() {
    this.user$.next(await fetchServer2<DBUser>(Method.GET, '/api/v2/me'));
    if (!this.user$.getValue()) this.logout();
  }

  // called when server sends a binary or json message to the client
  private async onMessage(message: MessageEvent) {

    const { type, data } = await decodeMessage(message.data, true);
    if (type === MessageType.JSON) {

      if ((data as JsonMessage).type !== JsonMessageType.PONG) console.log('Received JSON message:', data);
      this.jsonEvent$.next(data as JsonMessage);

    } else {

      // decode stream into packets from a player index
      const packets = data as PacketDisassembler;
      console.log(`Recieved ${packets.bitcount/8} bytes from player ${packets.getPlayerIndex()} this second`);

      const playerIndex = packets.getPlayerIndex()!;

      const packetList: PacketContent[] = [];    
      while (packets.hasMorePackets()) {
        packetList.push(packets.nextPacket());
        
      }
      const packetGroup: PacketGroup = { playerIndex, packets: packetList };
      this.packetGroup$.next(packetGroup);
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
  connectWebsocket() {

    // if already signed in, do nothing
    if (this.isSignedIn()) {
      console.error('Cannot connect when already signed in');
      return;
    }
    this.sessionID = uuid();

    const host = `ws://${location.host}/ws`;
    console.log("Connecting:", host);
    this.ws = new WebSocket(host);

    // when the websocket connects, send the OnConnectMessage to initiate the handshake
    this.ws.onopen = () => {
      console.log('Connected to the WebSocket server');
      this.sendJsonMessage(new OnConnectMessage(this.getUserID()!, this.getUsername()!, this.sessionID!));
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
  async logout() {

    if (!this.isSignedIn()) {
      return;
    }

    this.notificationService.notify(NotificationType.ERROR, "Logging out..");

    // send a request to the server to sign out
    await fetchServer2(Method.POST, '/api/v2/logout');

    this.ws?.close();
    this.ws = undefined;
    this.user$.next(undefined);
    this.sessionID = undefined;

    // redirect to login page with hard refresh if we're not already there
    if (location.pathname !== '/login') location.href = '/login';
  }

}
