/*
A room describes everyone involved in a tetris match (or game for soloplayer)
A room has a list of players (one for solo, two for multiplayer), a list of spectators,
and an optional “referee”, used specifically for unranked matches for the purposes of restream etc
Without a referee, match state is updated automatically by the server

A player can only be in one room at a time

Players stream their inputs to the server, which then broadcasts the inputs to all other players in the room.
The room tracks the game status of each of the players, caches the game state for each ongoing game, and
saves the game state to the database when the game ends.

This also works for singleplayer - there are no other players or spectators so nothing gets broadcasted,
but the room still tracks the game state and saves it to the database when the game ends.
*/

import { PacketAssembler } from "../../network-protocol/stream-packets/packet-assembler";
import { PACKET_NAME, PacketContent, PacketOpcode, isDatabasePacket } from "../../network-protocol/stream-packets/packet";
import { PacketDisassembler } from "../../network-protocol/stream-packets/packet-disassembler";
import { v4 as uuid } from "uuid";
import { OnlineUser, UserSession } from "./online-user";
import { Role, RoomInfo, isPlayer } from "../../network-protocol/models/room-info";


export class RoomUser {

  // only used for players. stores the game state packets that the user has sent for the current game
  private gameBinaryData: PacketAssembler = new PacketAssembler();

  constructor(
    public readonly room: Room,
    public readonly session: UserSession,
    public readonly role: Role,
  ) {}

  // send a binary message to the user
  sendBinaryMessage(stream: Uint8Array) {
    this.session.socket.send(stream);
  }

  // add a packet to the game state cache
  addGamePacket(packet: PacketContent) {
    this.gameBinaryData.addPacketContent(packet.binary);
  }

  // clear the cache, and return the packets of the finished game
  popCachedGameBinaryData(): Uint8Array {
    const data =this.gameBinaryData.encode();
    this.gameBinaryData = new PacketAssembler();
    return data;
  }

  isInGame(): boolean {
    return this.gameBinaryData.hasPackets();
  }

}

export class Room {

  private players: RoomUser[] = [];
  public readonly roomID: string;

  constructor() {
    this.roomID = uuid();
  }

  addUser(session: UserSession, role: Role) {

    if (this.players.find(player => player.session.user.username === session.user.username)) {
      throw new Error(`User ${session.user.username} is already in this room`);
    }

    console.log(`User ${session.user.username} joined room ${this}`);

    this.players.push(new RoomUser(this, session, role));
  }

  // remove a user from the room. returns true if the room is now empty and should be deleted
  async removeUser(roomUser: RoomUser): Promise<boolean> {

    // if user had a game in progress, save the game state to the database
    if (roomUser.isInGame()) {
      const gamePackets = roomUser.popCachedGameBinaryData();
      console.log("User left, so ended game forcibly with", gamePackets.length, "packets");
      await this.saveGameToDatabase(roomUser, gamePackets);
    }

    // remove the user from the room
    this.players = this.players.filter(player => player !== roomUser);

    // return true if the room is now empty
    return this.players.length === 0;
  }

  getUserBySocket(socket: WebSocket): RoomUser | undefined {
    return this.players.find(player => player.session.socket === socket);
  }

  getUserByUsername(username: string): RoomUser | undefined {
    return this.players.find(player => player.session.user.username === username);
  }

  async onBinaryMessage(roomUser: RoomUser, packets: PacketDisassembler) {

    if (isPlayer(roomUser.role)) {
      await this.onPlayerBroadcastPackets(roomUser, packets);
    }
  }

  // called when packets are recieved from a player client.
  // Broadcast the packets to all other players, and cache game state packets if in game
  async onPlayerBroadcastPackets(roomUser: RoomUser, packets: PacketDisassembler) {
    //console.log("Received binary message", packets.bitcount);

    // resend the binary message to all players in the room, except the user
    this.sendBinaryMessageToAllPlayersExcept(roomUser, packets.stream);
    
    // go through each packet in the stream and cache packets that are within a game
    while (packets.hasMorePackets()) {
      const packetContent = packets.nextPacket();

      if (packetContent.opcode !== PacketOpcode.NON_GAME_BOARD_STATE_CHANGE) {
        // console.log("Received packet", PACKET_NAME[packetContent.opcode]);
      }

      // if the user is in a game, or if the current packet just started game, cache the game state packets
      if (roomUser.isInGame() || packetContent.opcode === PacketOpcode.GAME_START) {

        // we only store packets in database that belong there
        if (isDatabasePacket(packetContent.opcode)) {
          roomUser.addGamePacket(packetContent);
          console.log("Caching packet", PACKET_NAME[packetContent.opcode]);
        }

      }

      // if this packet ends the game, save the game state to the database and clear the cache
      // we don't need to add the game end packet to the packet list
      if (packetContent.opcode === PacketOpcode.GAME_END) {
        const gamePackets = roomUser.popCachedGameBinaryData();
        console.log("Ended game with", gamePackets.length, "packets");
        
        await this.saveGameToDatabase(roomUser, gamePackets);
      }
    }
  }

  // given all the packets of a game for a user, save the game state to the database
  async saveGameToDatabase(roomUser: RoomUser, gameBinaryData: Uint8Array) {
    // TODO: save game state to database
    console.log("Saving game state to database for user", roomUser.session.user.username, gameBinaryData);
  }

  // send a binary message to all players in the room, except the specified user
  // useful for broadcasting game state updates
  sendBinaryMessageToAllPlayersExcept(roomUser: RoomUser, stream: Uint8Array) {
    this.players.filter(player => player !== roomUser).forEach(player => player.sendBinaryMessage(stream));
  }

  // get a serialized dict of the room info for sending to clients
  getRoomInfo(): RoomInfo {
    return {
      roomID: this.roomID,
      players: this.players.map(player => ({
        username: player.session.user.username,
        sessionID: player.session.user.sessionID,
        role: player.role,
      }))
    };
  }

}