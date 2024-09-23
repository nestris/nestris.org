import { Challenge } from "../../shared/models/challenge";
import { OnlineUserStatus } from "../../shared/models/friends";
import { Role, RoomMode } from "../../shared/models/room-info";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { OnlineUser, UserSession } from "./online-user";
import { Room, RoomUser } from "./room";
import { ServerState } from "./server-state";


export class RoomManager {

  private rooms: Room[] = [];

  constructor(private readonly state: ServerState) {}

  getRoomByID(roomID: string): Room | undefined {
    return this.rooms.find(room => room.roomID === roomID);
  }

  getUserByUserID(userid: string): RoomUser | undefined {
    for (const room of this.rooms) {
      const user = room.getUserByUserID(userid);
      if (user) return user;
    }
    return undefined;
  }

  getUserBySessionID(sessionID: string): RoomUser | undefined {
    for (const room of this.rooms) {
      const user = room.getUserBySessionID(sessionID);
      if (user) return user;
    }
    return undefined;
  }

  containsUser(userid: string): boolean {
    return this.getUserByUserID(userid) !== undefined;
  }

  getUserBySocket(socket: WebSocket): RoomUser | undefined {
    for (const room of this.rooms) {
      const user = room.getUserBySocket(socket);
      if (user) return user;
    }
    return undefined;
  }

  assertUserNotInRoom(user: OnlineUser) {

    if (this.getUserByUserID(user.userid)) {
      throw new Error(`User ${user.username} is already in a room`);
    }

    if (user.status === OnlineUserStatus.PLAYING) {
      throw new Error(`User ${user.username} is not available to join a room`);
    }
  }

  // create a room for a single player, return the room id
  async createSingleplayerRoom(session: UserSession): Promise<string> {

    this.assertUserNotInRoom(session.user);

    // create a new room
    const room = new Room([session]);
    await room.init();
    this.rooms.push(room);

    // notify the user that they have entered the game
    session.user.onEnterRoom();
    
    return room.roomID;
  }

  // create a room between challenge.senderSessionID and receiverSessionID, return the room id
  async createMultiplayerRoom(challenge: Challenge, receiverSessionID: string): Promise<string> {

    const sender = this.state.onlineUserManager.getOnlineUserByUserID(challenge.senderid);
    const receiver = this.state.onlineUserManager.getOnlineUserByUserID(challenge.receiverid);

    // sanity checks that both users are online
    if (!sender || !receiver) throw new Error("Sender or receiver not online, cannot create multiplayer room");
    this.assertUserNotInRoom(sender);
    this.assertUserNotInRoom(receiver);

    // get the sessions
    const senderSession = sender.getSessionByID(challenge.senderSessionID);
    const receiverSession = receiver.getSessionByID(receiverSessionID);

    // sanity checks that both sessions are online
    if (!senderSession || !receiverSession) throw new Error("Sender or receiver session not online, cannot create multiplayer room");

    // At this point, we can create the room
    const room = new Room([senderSession, receiverSession], challenge);
    await room.init();
    this.rooms.push(room);

    console.log("Created multiplayer room for", challenge.senderUsername, "and", challenge.receiverUsername, room.roomID);

    // notify the users that they have entered the game
    sender.onEnterRoom();
    receiver.onEnterRoom();

    return room.roomID;
  }

  addSpectatorToRoom(roomID: string, session: UserSession) {
    const room = this.rooms.find(room => room.roomID === roomID);
    if (!room) throw new Error(`Room ${roomID} not found`);
    
    // add the spectator to the room
    room.addSpectator(session);
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

    await roomUser.room.removeUser(roomUser); // remove user from room
    roomUser.session.user.onLeaveRoom();
    console.log(`User ${roomUser.session.user.username} left room ${roomUser.room}`);
    this.removeEmptyRooms();
  }

  // Delete empty rooms and log wihch rooms were deleted
  removeEmptyRooms() {
    this.rooms = this.rooms.filter(room => {
      if (room.isEmpty()) {
        console.log(`Room deleted: ${room.roomID}`);
        return false;
      }
      return true;
    });
  }




}