import { Injectable } from '@angular/core';
import { ChatMessage, InRoomStatus, InRoomStatusMessage, JsonMessage, JsonMessageType, RoomEventMessage } from 'src/app/shared/network/json-message';
import { RoomInfo, RoomInfoManager } from 'src/app/shared/room/room-models';
import { WebsocketService } from '../websocket.service';
import { RoomInfoManagerFactory } from 'src/app/shared/room/room-info-manager-factory';


/**
 * A service that manages the state of the room the client is in.
 * 
 * IN_ROOM_STATUS messages from the server update the ClientRoom on whether the session is in a room or not. On the other hand,
 * the client can be either present or not present in the room it's in, and sends ROOM_PRESENCE messages to the server to update
 * its presence status.
 */
@Injectable({
  providedIn: 'root'
})
export class RoomService {

  private status: InRoomStatus = InRoomStatus.NONE;
  private roomInfoManager: RoomInfoManager<RoomInfo, RoomEventMessage> | null = null;

  constructor(
    private websocketService: WebsocketService
  ) {

    this.websocketService.onEvent(JsonMessageType.IN_ROOM_STATUS).subscribe((event: JsonMessage) => {
      this.onInRoomStatusEvent(event as InRoomStatusMessage);
    });

    this.websocketService.onEvent(JsonMessageType.ROOM_EVENT).subscribe((event: JsonMessage) => {
      this.onRoomEvent(event as RoomEventMessage);
    });

    this.websocketService.onEvent(JsonMessageType.CHAT).subscribe((event: JsonMessage) => {
      console.log('Received chat message', (event as ChatMessage).message);
    });

  }


  /**
   * Update the room state based on the IN_ROOM_STATUS message from the server.
   * @param event The IN_ROOM_STATUS message
   */
  private onInRoomStatusEvent(event: InRoomStatusMessage) {

    // If the client is not in a room
    if (event.status === InRoomStatus.NONE) {
      this.status = InRoomStatus.NONE;
      this.roomInfoManager = null;

      console.log("Updated room status to NONE");
      return;
    }

    // Assert that roomID exists now that the client is in a room
    if (!event.roomInfo) {
      throw new Error('Client is in a room but room info is missing');
    }

    // Update the room state
    this.status = event.status;
    this.roomInfoManager = RoomInfoManagerFactory.create(event.roomInfo);

    console.log(`Updated room status to ${this.status} with room info ${this.roomInfoManager.get()}`);
  }

  /**
   * Update the room state based on the ROOM_EVENT message from the server.
   * @param event The ROOM_EVENT message
   */
  private onRoomEvent(event: RoomEventMessage) {

    if (!this.roomInfoManager) {
      throw new Error('Client is not in a room but received a room event');
    }

    this.roomInfoManager.onEvent(event);
    console.log(`From event ${event}, updated room info to ${this.roomInfoManager.get()}`);
  }

}
