import { Role } from "../../network-protocol/models/room-info";
import { OnlineUserStatus } from "../../network-protocol/models/friends";
import { PacketDisassembler } from "../../network-protocol/stream-packets/packet-disassembler";
import { OnlineUser, UserSession } from "./online-user";
import { Room, RoomUser } from "./room";
import { ServerState } from "./server-state";

export class RoomManager {

  private rooms: Room[] = [];

  constructor(private readonly state: ServerState) {}

  getRoomByID(roomID: string): Room | undefined {
    return this.rooms.find(room => room.roomID === roomID);
  }

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

  assertUserNotInRoom(user: OnlineUser) {

    if (this.getUserByUsername(user.username)) {
      throw new Error(`User ${user.username} is already in a room`);
    }

    if (user.status === OnlineUserStatus.PLAYING) {
      throw new Error(`User ${user.username} is not available to join a room`);
    }
  }

  // create a room for a single player, return the room id
  createSingleplayerRoom(session: UserSession): string {

    this.assertUserNotInRoom(session.user);

    session.user.onEnterGame(this.state);

    const room = new Room();
    this.rooms.push(room);

    room.addUser(session, Role.PLAYER_1);
    
    return room.roomID;
  }

  addSpectatorToRoom(roomID: string, session: UserSession) {
    const room = this.rooms.find(room => room.roomID === roomID);
    if (!room) throw new Error(`Room ${roomID} not found`);

    room.addUser(session, Role.SPECTATOR);
  }

  // forward binary message to the correct room
  async onBinaryMessage(socket: WebSocket, packets: PacketDisassembler) {
    const user = this.getUserBySocket(socket);
    
    if (!user) {
      const username = this.state.onlineUserManager.getOnlineUserBySocket(socket)?.username;
      console.log("Packet(s) discarded: recieved from socket not in room with username", username);
      return;
    }

    await user.room.onBinaryMessage(user, packets);
  }

  async removeSocket(socket: WebSocket) {
    const roomUser = this.getUserBySocket(socket);
    if (!roomUser) return;

    const isEmpty = await roomUser.room.removeUser(roomUser); // remove user from room
    roomUser.session.user.onLeaveGame(this.state);
    console.log(`User ${roomUser.session.user.username} left room ${roomUser.room}`);
    if (isEmpty) {
      this.rooms = this.rooms.filter(room => room !== roomUser.room); // remove room if now empty
      console.log(`Room deleted: ${roomUser.room}`);
    }
  }




}