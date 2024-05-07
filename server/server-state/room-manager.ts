import { PacketDisassembler } from "network-protocol/stream-packets/packet-disassembler";
import { Role, Room, RoomUser } from "./room";
import { ServerState } from "./server-state";

export class RoomManager {

  private rooms: Room[] = [];

  constructor(private readonly state: ServerState) {}

  getUserByUsername(username: string): RoomUser | undefined {
    for (const room of this.rooms) {
      const user = room.getUserByUsername(username);
      if (user) return user;
    }
    return undefined;
  }

  getUserBySocket(socket: WebSocket): RoomUser | undefined {
    for (const room of this.rooms) {
      const user = room.getUserBySocket(socket);
      if (user) return user;
    }
    return undefined;
  }

  createSingleplayerRoom(username: string, socket: WebSocket) {

    // assert user is not already in a room
    if (this.getUserByUsername(username)) {
      throw new Error(`User ${username} is already in a room`);
    }

    const room = new Room();
    room.addUser(username, Role.PLAYER_1, socket);

    this.rooms.push(room);
  }

  // forward binary message to the correct room
  async onBinaryMessage(socket: WebSocket, packets: PacketDisassembler) {
    const user = this.getUserBySocket(socket);
    
    if (!user) {
      console.log("User not found for socket", socket);
      return;
    }

    user.room.onBinaryMessage(user, packets);
  }




}