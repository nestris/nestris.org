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

import { PacketDisassembler } from "../../network-protocol/stream-packets/packet-disassembler";

export enum Role {
  PLAYER_1 = "PLAYER_1", // for solo, or player 1 in multiplayer. streams inputs to server
  PLAYER_2 = "PLAYER_2", // player 2 in multiplayer. streams inputs to server
  SPECTATOR = "SPECTATOR", // only receives game state updates
  REFEREE = "REFEREE", // recieves game state updates, and can also update match state
}
export const isPlayer = (role: Role) => role === Role.PLAYER_1 || role === Role.PLAYER_2;

export class RoomUser {
  constructor(
    public readonly room: Room,
    public readonly username: string,
    public readonly role: Role,
    public readonly socket: WebSocket,
  ) {}

  // send a binary message to the user
  sendBinaryMessage(stream: Uint8Array) {
    this.socket.send(stream);
  }
}

export class Room {

  private players: RoomUser[] = [];

  addUser(username: string, role: Role, socket: WebSocket) {

    if (this.players.find(player => player.username === username)) {
      throw new Error(`User ${username} is already in this room`);
    }

    console.log(`User ${username} joined room ${this}`);

    this.players.push(new RoomUser(this, username, role, socket));
  }

  // remove a user from the room. returns true if the room is now empty and should be deleted
  removeUser(user: RoomUser): boolean {
    this.players = this.players.filter(player => player !== user);
    return this.players.length === 0;
  }

  getUserBySocket(socket: WebSocket): RoomUser | undefined {
    return this.players.find(player => player.socket === socket);
  }

  getUserByUsername(username: string): RoomUser | undefined {
    return this.players.find(player => player.username === username);
  }

  onBinaryMessage(user: RoomUser, packets: PacketDisassembler) {

    if (isPlayer(user.role)) {
      this.onPlayerBroadcastPackets(user, packets);
    }
  }

  onPlayerBroadcastPackets(user: RoomUser, packets: PacketDisassembler) {

    // resend the binary message to all players in the room, except the user
    this.sendBinaryMessageToAllPlayersExcept(user, packets.stream);

    console.log("Received binary message", packets.bitcount);
    while (packets.hasMorePackets()) {
      const {opcode, content} = packets.nextPacket();
      // TODO: handle packets
    }

  }

  // send a binary message to all players in the room, except the specified user
  // useful for broadcasting game state updates
  sendBinaryMessageToAllPlayersExcept(user: RoomUser, stream: Uint8Array) {
    this.players.filter(player => player !== user).forEach(player => player.sendBinaryMessage(stream));
  }

}