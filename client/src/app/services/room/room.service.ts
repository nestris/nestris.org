import { Injectable, Injector } from '@angular/core';
import { ChatMessage, InRoomStatus, InRoomStatusMessage, JsonMessage, JsonMessageType, LeaveRoomMessage, RoomStateUpdateMessage, SpectatorCountMessage } from 'src/app/shared/network/json-message';
import { RoomInfo, RoomState, RoomType } from 'src/app/shared/room/room-models';
import { WebsocketService } from '../websocket.service';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { MeService } from '../state/me.service';
import { ClientRoom } from './client-room';
import { SoloClientRoom } from './solo-client-room';
import { RoomModal } from 'src/app/components/layout/room/room/room.component';
import { v4 as uuid } from 'uuid';
import { SoloRoomState } from 'src/app/shared/room/solo-room-models';
import { MultiplayerClientRoom } from './multiplayer-client-room';

const MAX_MESSAGES = 15;
export interface Message {
  id: string;
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

  // The client room the client is currently in
  private clientRoom: ClientRoom | null = null;

  // The client room the client is currently in, or was in before it was destroyed
  private oldClientRoom: ClientRoom | null = null;

  public modal$ = new BehaviorSubject<RoomModal | null>(null);

  private roomInfo: RoomInfo | null = null;
  private numSpectators$ = new BehaviorSubject<number>(0);

  private messages$ = new BehaviorSubject<Message[]>([]);

  constructor(
    private injector: Injector,
    private websocketService: WebsocketService,
    private meService: MeService,
    private router: Router,
  ) {

    this.websocketService.onEvent(JsonMessageType.IN_ROOM_STATUS).subscribe(async (event: JsonMessage) => {
      await this.onInRoomStatusEvent(event as InRoomStatusMessage);
    });

    this.websocketService.onEvent(JsonMessageType.ROOM_STATE_UPDATE).subscribe(async (event: JsonMessage) => {
      await this.onRoomStateUpdate(event as RoomStateUpdateMessage);
    });

    this.websocketService.onEvent(JsonMessageType.SPECTATOR_COUNT).subscribe((event: JsonMessage) => {
      this.numSpectators$.next((event as SpectatorCountMessage).count);
    });

    this.websocketService.onEvent(JsonMessageType.CHAT).subscribe((event: JsonMessage) => {
      const chatMessage = event as ChatMessage;

      // Push the message to the messages array, limiting the number of messages
      this.messages$.next([
        ...this.messages$.getValue(), { id: uuid(), username: chatMessage.username, message: chatMessage.message }
      ].slice(-MAX_MESSAGES));
    });
  }

  /**
   * Leave the room the client is in, if any.
   */
  public leaveRoom() {

    // Cleanup the client room
    this.clientRoom?.destroy();

    // Tell the server to leave the room
    this.websocketService.sendJsonMessage(new LeaveRoomMessage());
  }

  /**
   * Send a chat message to the server.
   */
  public async sendChatMessage(message: string) {
    const username = await this.meService.getUsername();
    this.websocketService.sendJsonMessage(new ChatMessage(username, message));
  }

  private createClientRoom(roomState: RoomState): ClientRoom {

    // Reset modal
    this.modal$.next(null);

    // Create the client room based on the room type
    switch (roomState.type) {
      case RoomType.SOLO: return new SoloClientRoom(this.injector, this.modal$, roomState as SoloRoomState);
      case RoomType.MULTIPLAYER: return new MultiplayerClientRoom(this.injector, this.modal$, roomState);
      default: throw new Error(`Unknown room type ${roomState.type}`);
    }
  }

  /**
   * Update the room state based on the IN_ROOM_STATUS message from the server.
   * @param event The IN_ROOM_STATUS message
   */
  private async onInRoomStatusEvent(event: InRoomStatusMessage) {

    // If the client is not in a room
    if (event.status === InRoomStatus.NONE) {
      this.status = InRoomStatus.NONE;
      this.roomInfo = null;
      this.clientRoom = null;
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

    // Create the client room
    this.clientRoom = this.createClientRoom(event.roomState);
    this.oldClientRoom = this.clientRoom;
    await this.clientRoom.init(event.roomState);

    // Navigate to the room
    this.router.navigate(['/online/room']);

    console.log(`Navigating to room with status ${this.status}, room info ${this.roomInfo}, and room state ${this.clientRoom.getState()}`);
  }

  /**
   * Update the room state based on the ROOM_EVENT message from the server.
   * @param event The ROOM_EVENT message
   */
  private async onRoomStateUpdate(event: RoomStateUpdateMessage) {

    if (!this.clientRoom) {
      throw new Error('Client is not in a room but received a room state update');
    }

    await this.clientRoom._updateState(event.state);
    console.log('Updated room state', event.state);
  }

  /**
   * Get the room info.
   */
  public getRoomInfo(): RoomInfo | null {
    return this.roomInfo;
  }

  /**
   * Get the type of the room.
   * @returns The type of the room, or null if the client is not in a room
   */
  public getRoomType(): RoomType | null {
    if (!this.clientRoom) return null;
    return this.clientRoom.getState().type;
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

  /**
   * Get the client room.
   * @returns The client room
   */
  public getClient<T extends ClientRoom = ClientRoom>(): T {
    if (!this.clientRoom) {
      throw new Error('Client is not in a room');
    }
    return this.clientRoom as T;
  }

  /**
   * Get the old client room.
   * @returns The old client room
   */
  public getOldClient<T extends ClientRoom = ClientRoom>(): T {
    if (!this.oldClientRoom) {
      throw new Error('Client is not in a room');
    }
    return this.oldClientRoom as T;
  }

}

