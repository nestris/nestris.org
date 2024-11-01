import { Injectable } from '@angular/core';
import { ChatMessage, InRoomStatus, InRoomStatusMessage, JsonMessage, JsonMessageType, LeaveRoomMessage, RoomStateUpdateMessage, SpectatorCountMessage } from 'src/app/shared/network/json-message';
import { RoomInfo, RoomState } from 'src/app/shared/room/room-models';
import { WebsocketService } from '../websocket.service';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { MeService } from '../state/me.service';

const MAX_MESSAGES = 15;
export interface Message {
  username: string;
  message: string;
}


/**
 * A service that manages the state of the room the client is in.
 * 
 * IN_ROOM_STATUS messages from the server update the ClientRoom on whether the session is in a room or not.
 */
@Injectable({
  providedIn: 'root'
})
export class RoomService {

  private status: InRoomStatus = InRoomStatus.NONE;

  private roomInfo: RoomInfo | null = null;
  private roomState$ = new BehaviorSubject<RoomState | null>(null);
  private numSpectators$ = new BehaviorSubject<number>(0);

  private messages$ = new BehaviorSubject<Message[]>([]);

  constructor(
    private websocketService: WebsocketService,
    private meService: MeService,
    private router: Router,
  ) {

    this.websocketService.onEvent(JsonMessageType.IN_ROOM_STATUS).subscribe((event: JsonMessage) => {
      this.onInRoomStatusEvent(event as InRoomStatusMessage);
    });

    this.websocketService.onEvent(JsonMessageType.ROOM_STATE_UPDATE).subscribe((event: JsonMessage) => {
      this.onRoomStateUpdate(event as RoomStateUpdateMessage);
    });

    this.websocketService.onEvent(JsonMessageType.SPECTATOR_COUNT).subscribe((event: JsonMessage) => {
      this.numSpectators$.next((event as SpectatorCountMessage).count);
    });

    this.websocketService.onEvent(JsonMessageType.CHAT).subscribe((event: JsonMessage) => {
      const chatMessage = event as ChatMessage;

      // Push the message to the messages array, limiting the number of messages
      this.messages$.next([
        ...this.messages$.getValue(), { username: chatMessage.username, message: chatMessage.message }
      ].slice(-MAX_MESSAGES));
    });
  }

  /**
   * Leave the room the client is in, if any.
   */
  public leaveRoom() {
    this.websocketService.sendJsonMessage(new LeaveRoomMessage());
  }

  /**
   * Send a chat message to the server.
   */
  public async sendChatMessage(message: string) {
    const username = await this.meService.getUsername();
    this.websocketService.sendJsonMessage(new ChatMessage(username, message));
  }

  /**
   * Update the room state based on the IN_ROOM_STATUS message from the server.
   * @param event The IN_ROOM_STATUS message
   */
  private onInRoomStatusEvent(event: InRoomStatusMessage) {

    // If the client is not in a room
    if (event.status === InRoomStatus.NONE) {
      this.status = InRoomStatus.NONE;
      this.roomInfo = null;
      this.roomState$.next(null);
      this.messages$.next([]);

      console.log("Updated room status to NONE");
      return;
    }

    // Assert that roomID exists now that the client is in a room
    if (!event.roomInfo || !event.roomState) {
      throw new Error('Client is in a room but room info is missing');
    }

    // Update the room state
    this.status = event.status;
    this.roomInfo = event.roomInfo;
    this.roomState$.next(event.roomState);

    // Navigate to the room
    this.router.navigate(['/online/room']);

    console.log(`Navigating to room with status ${this.status}, room info ${this.roomInfo}, and room state ${this.roomState$.getValue()}`);
  }

  /**
   * Update the room state based on the ROOM_EVENT message from the server.
   * @param event The ROOM_EVENT message
   */
  private onRoomStateUpdate(event: RoomStateUpdateMessage) {

    if (!this.roomInfo) {
      throw new Error('Client is not in a room but received a room state update');
    }

    this.roomState$.next(event.state);
    console.log('Updated room state', event.state);
  }

  /**
   * Get the room info.
   */
  public getRoomInfo(): RoomInfo | null {
    return this.roomInfo;
  }

  /**
   * Get the room state as an observable.
   */
  public getRoomState$(): Observable<RoomState | null> {
    return this.roomState$.asObservable();
  }

  /**
   * Get the room state.
   */
  public getRoomState(): RoomState | null {
    return this.roomState$.getValue();
  }

  /**
   * Get the messages as an observable.
   */
  public getMessages$(): Observable<Message[]> {
    return this.messages$.asObservable();
  }

  /**
   * Get the number of spectators as an observable.
   */
  public getNumSpectators$(): Observable<number> {
    return this.numSpectators$.asObservable();
  }
}

