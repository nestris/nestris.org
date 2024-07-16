import { Challenge } from "../../shared/models/challenge";
import { OnlineUserStatus } from "../../shared/models/friends";
import { Role, RoomMode } from "../../shared/models/room-info";
import { RequestRecoveryPacketMessage } from "../../shared/network/json-message";
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

  getUserByUsername(username: string): RoomUser | undefined {
    for (const room of this.rooms) {
      const user = room.getUserByUsername(username);
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

  containsUser(username: string): boolean {
    return this.getUserByUsername(username) !== undefined;
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

    // create a new room
    const room = new Room(RoomMode.SOLO);
    this.rooms.push(room);

    // add the user to the room
    room.addUser(session, Role.PLAYER_1);

    // notify the user that they have entered the game
    session.user.onEnterGame(this.state);
    
    return room.roomID;
  }

  // create a room between challenge.senderSessionID and receiverSessionID, return the room id
  createMultiplayerRoom(challenge: Challenge, receiverSessionID: string) {

    const sender = this.state.onlineUserManager.getOnlineUserByUsername(challenge.sender);
    const receiver = this.state.onlineUserManager.getOnlineUserByUsername(challenge.receiver);

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
    const room = new Room(RoomMode.MULTIPLAYER);
    this.rooms.push(room);

    console.log("Creating multiplayer room for", challenge.sender, "and", challenge.receiver, room.roomID);


    // add the users to the room
    room.addUser(senderSession, Role.PLAYER_1);
    room.addUser(receiverSession, Role.PLAYER_2);

    // notify the users that they have entered the game
    sender.onEnterGame(this.state);
    receiver.onEnterGame(this.state);

    return room.roomID;
  }

  // create a room for two players, return the room id

  addSpectatorToRoom(roomID: string, session: UserSession) {
    const room = this.rooms.find(room => room.roomID === roomID);
    if (!room) throw new Error(`Room ${roomID} not found`);

    const newUser = room.addUser(session, Role.SPECTATOR);

    // request all other players to send FullRecovery packet to initialize new player
    room.sendJsonMessageToAllPlayersExcept(newUser, new RequestRecoveryPacketMessage());
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