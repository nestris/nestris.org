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
import { ServerStatsService } from './server-stats.service';
import { DeploymentEnvironment } from '../shared/models/server-stats';
import { FetchService, Method } from './fetch.service';


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
  private sessionID?: string;

  private jsonEvent$ = new Subject<JsonMessage>();
  private packetGroup$ = new Subject<PacketGroup>();

  private signedInSubject$ = new BehaviorSubject<boolean>(false);

  constructor(
    private fetchService: FetchService,
    private notificationService: NotificationService,
    private serverStats: ServerStatsService,
    private router: Router,
  ) {}

  // Initialize the websocket service with a user id and username, connecting to the websocket
  public async init(userid: string, username: string) {

    this.sessionID = uuid();

    // if the user is already signed in, connect to the websocket
    console.log("Logged in. Connecting to websocket...")
    this.notificationService.notify(NotificationType.INFO, "Connecting to server...");

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
      console.log('Connection successful, signed in.');

      // If on login page, redirect to home page
      if (location.pathname === '/login') {
        console.log('Logged in but on login page. Redirecting to home page...');
        this.router.navigate(['/']);
      }

      // Notify the user that they are signed in
      this.notificationService.notify(NotificationType.SUCCESS, `Logged in as ${username}`)
      this.signedInSubject$.next(true);
    });


    // Start websocket handshake
    await this.connectWebsocket(userid, username);
  }

  // Call this function to login with discord
  async login() {

    // After discord login, redirect to this callback URL in the server to process the code
    const redirectUri = encodeURIComponent(window.location.origin + '/api/v2/callback');

    // Redirect to discord login page. Hard refresh to avoid CORS issues
    location.href = `api/v2/login?redirectUri=${redirectUri}`;
  }

  async registerAsGuest() {

    // First, register as a guest
    await this.fetchService.fetch(Method.POST, '/api/v2/register-as-guest');

    // Then, go to the play page
    location.href = '/play';
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

  // Wait until the user signs in
  async waitForSignIn() {
    return new Promise<void>((resolve) => {
      this.onSignIn().subscribe(() => resolve());
    });
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
  onEvent<T extends JsonMessage>(event: JsonMessageType): Observable<T> {
    return this.jsonEvent$.asObservable().pipe(
      filter((message) => message.type === event),
      map((message) => message as T)
    );
  }

  onPacketGroup(): Observable<PacketGroup> {
    return this.packetGroup$.asObservable();
  }


  getSessionID(): string | undefined {
    return this.sessionID;
  }


  // called when server sends a binary or json message to the client
  private async onMessage(message: MessageEvent) {

    const { type, data } = await decodeMessage(message.data, true);
    if (type === MessageType.JSON) {

      if ((data as JsonMessage).type !== JsonMessageType.PING) console.log('Received JSON message:', data);
      this.jsonEvent$.next(data as JsonMessage);

    } else {

      // decode stream into packets from a player index
      const packets = data as PacketDisassembler;

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
    this.ws?.send(message);
  }

  // called to connect to server
  // if the connection is successful, a ws connection is established and the user is signed in
  async connectWebsocket(userid: string, username: string) {

    // if already signed in, do nothing
    if (this.isSignedIn()) {
      console.error('Cannot connect when already signed in');
      return;
    }

    const stats = await this.serverStats.waitForServerStats();

    // Production uses HTTPS so we need to use wss://
    let host;
    if (stats.environment === DeploymentEnvironment.PRODUCTION) {
      host = `wss://${location.host}/ws`;
      console.log("Production environment detected. Using wss://");
    } else {
      host = `ws://${location.host}/ws`;
      console.log("Non-production environment detected. Using ws://");
    }

    console.log("Connecting:", host);
    this.ws = new WebSocket(host);

    // when the websocket connects, send the OnConnectMessage to initiate the handshake
    this.ws.onopen = () => {
      console.log('Connected to the WebSocket server');
      this.sendJsonMessage(new OnConnectMessage(userid, username, this.sessionID!));
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

  async leaveGuestAndLogin() {

    // First, log out
    await this.fetchService.fetch(Method.POST, '/api/v2/logout');

    // Then, login
    await this.login();
  }


  // called to disconnect from server. this will trigger the onclose event
  // and thus sign out the user
  async logout() {

    // If not yet signed in, redirect to login page
    if (!this.isSignedIn()) {
      if (location.pathname !== '/login') location.href = '/login';
      return;
    }

    this.notificationService.notify(NotificationType.ERROR, "Logging out..");

    // send a request to the server to sign out
    await this.fetchService.fetch(Method.POST, '/api/v2/logout');

    this.ws?.close();
    this.ws = undefined;
    this.sessionID = undefined;

    // redirect to login page with hard refresh if we're not already there
    if (location.pathname !== '/login') location.href = '/login';
  }

}
