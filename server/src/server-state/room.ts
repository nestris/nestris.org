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

import { v4 as uuid } from "uuid";
import { RoomMode, isPlayer, RoomInfo, Role } from "../../shared/models/room-info";
import { BinaryEncoder, BinaryDecoder } from "../../shared/network/binary-codec";
import { JsonMessage } from "../../shared/network/json-message";
import { PacketContent, PacketOpcode, isDatabasePacket, PACKET_NAME } from "../../shared/network/stream-packets/packet";
import { PacketAssembler, MAX_PLAYERS_IN_ROOM, MAX_PLAYER_BITCOUNT } from "../../shared/network/stream-packets/packet-assembler";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { UserSession } from "./online-user";


export class RoomUser {

  // only used for players. stores the game state packets that the user has sent for the current game
  private gameBinaryData: PacketAssembler = new PacketAssembler();

  constructor(
    public readonly room: Room,
    public readonly session: UserSession,
    public readonly role: Role,
  ) {}

  // send a binary message to the user (only the session in the room)
  sendBinaryMessage(stream: Uint8Array) {
    console.log("Sending binary message to user", this.session.user.username, stream.length);
    this.session.socket.send(stream);
  }

  // send a json message to the user (only the session in the room)
  sendJsonMessage(message: JsonMessage) {
    console.log("Sending json message to user", this.session.user.username, message);
    this.session.socket.send(JSON.stringify(message));
  }

  // add a packet to the game state cache
  addGamePacket(packet: PacketContent) {
    this.gameBinaryData.addPacketContent(packet.binary);
  }

  // clear the cache, and return the packets of the finished game
  popCachedGameBinaryData(): Uint8Array {
    const data = this.gameBinaryData.encode();
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
  public readonly mode: RoomMode;

  constructor(mode: RoomMode) {
    this.roomID = uuid();
    this.mode = mode;
  }

  addUser(session: UserSession, role: Role): RoomUser {

    if (this.players.find(player => player.session.user.username === session.user.username)) {
      throw new Error(`User ${session.user.username} is already in this room`);
    }

    if (isPlayer(role) && this.players.length >= MAX_PLAYERS_IN_ROOM) {
      throw new Error(`Room exeeds max players of ${MAX_PLAYERS_IN_ROOM}`);
    }

    console.log(`User ${session.user.username} joined room ${this.roomID}`);

    const newUser = new RoomUser(this, session, role)
    this.players.push(newUser);

    return newUser;
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

  getUserByUserID(userid: number): RoomUser | undefined {
    return this.players.find(player => player.session.user.userid === userid);
  }

  getUserBySessionID(sessionID: string): RoomUser | undefined {
    return this.players.find(player => player.session.user.sessionID === sessionID);
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

    // prefix the stream with the RoomUser's index
    const encoder = new BinaryEncoder();
    const playerIndex = this.players.indexOf(roomUser);
    encoder.addUnsignedInteger(playerIndex, MAX_PLAYER_BITCOUNT);

    // resend the binary message to all players in the room, except the user
    encoder.addBinaryDecoder(BinaryDecoder.fromUInt8Array(packets.stream));
    console.log(`sending ${encoder.bitcount} bits to all players from player ${playerIndex}`);
    this.sendBinaryMessageToAllPlayersExcept(roomUser, encoder);
    
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
  sendBinaryMessageToAllPlayersExcept(roomUser: RoomUser, encoder: BinaryEncoder) {
    this.players.filter(player => player !== roomUser).forEach(player => player.sendBinaryMessage(encoder.convertToUInt8Array()));
  }

  sendJsonMessageToAllPlayersExcept(roomUser: RoomUser, message: JsonMessage) {
    this.players.filter(player => player !== roomUser).forEach(player => player.sendJsonMessage(message));
  }

  sendJsonMessageToAllPlayers(message: JsonMessage) {
    this.players.forEach(player => player.sendJsonMessage(message));
  }

  // get a serialized dict of the room info for sending to clients
  getRoomInfo(): RoomInfo {
    return {
      roomID: this.roomID,
      mode: this.mode,
      players: this.players.map(player => ({
        userid: player.session.user.userid,
        username: player.session.user.username,
        sessionID: player.session.user.sessionID,
        role: player.role,
      }))
    };
  }

}