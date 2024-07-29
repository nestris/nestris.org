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
import { JsonMessage, MultiplayerRoomUpdateMessage, SoloGameEndMessage } from "../../shared/network/json-message";
import { PacketContent, PacketOpcode, GamePlacementSchema, GameStartSchema, GameRecoveryPacket } from "../../shared/network/stream-packets/packet";
import { PacketAssembler, MAX_PLAYERS_IN_ROOM, MAX_PLAYER_BITCOUNT } from "../../shared/network/stream-packets/packet-assembler";
import { PacketDisassembler } from "../../shared/network/stream-packets/packet-disassembler";
import { UserSession } from "./online-user";
import { MultiplayerManager } from "./room-multiplayer-manager";
import { MatchInfo, MultiplayerData, MultiplayerRoomState, PlayerRole } from "../../shared/models/multiplayer";
import { GameState } from "../../shared/game-state-from-packets/game-state";


export class RoomUser {

  // only used for players. stores the game state packets that the user has sent for the current game
  private gameBinaryData: PacketAssembler = new PacketAssembler();

  // We keep track of the current game state for the user mainly for recovery purposes
  private gameState?: GameState;

  private readonly sessionsPacketsSentTo: Set<string> = new Set();

  constructor(
    public readonly room: Room,
    public readonly session: UserSession,
    public readonly role: Role,
  ) {
    
    // add the user's own session ID to the list of sessions that the user has sent packets to
    // so that the user doesn't send packets to themselves
    this.sessionsPacketsSentTo.add(session.user.sessionID);
  }

  // send a binary message to the user (only the session in the room)
  sendBinaryMessage(stream: Uint8Array) {
    this.session.socket.send(stream);
  }

  // send a json message to the user (only the session in the room)
  sendJsonMessage(message: JsonMessage) {
    console.log("Sending json message to user", this.session.user.username, message);
    this.session.socket.send(JSON.stringify(message));
  }


  addGamePacket(packet: PacketContent) {
    // push packet content into ongoing binary game cache
    this.gameBinaryData.addPacketContent(packet.binary);

    // Update the current game state. We only care about game start and game placement packets.
    // Other packets are ignored, as they don't affect the game state
    if (packet.opcode === PacketOpcode.GAME_START) {
      console.log(`Player ${this.session.user.username} RoomUser received game start packet`);
      const gameStart = (packet.content as GameStartSchema);
      this.gameState = new GameState(gameStart.level, gameStart.current, gameStart.next);
    } else if (packet.opcode === PacketOpcode.GAME_PLACEMENT) {
      if (!this.gameState) throw new Error("Cannot add game placement packet without game start packet");
      const gamePlacement = (packet.content as GamePlacementSchema);
      this.gameState.onPlacement(gamePlacement.mtPose, gamePlacement.nextNextType, gamePlacement.pushdown);
      console.log(`Player ${this.session.user.username} now has score: ${this.gameState.getStatus().score}`);
    }
  }

  // clear the cache of game packets
  resetGame() {
    this.gameBinaryData = new PacketAssembler();
    this.gameState = undefined;
  }

  // clear the cache, and return the packets of the finished game
  popCachedGameBinaryData(): Uint8Array {
    const data = this.gameBinaryData.encode();
    this.resetGame();
    return data;
  }

  isInGame(): boolean {
    return this.gameBinaryData.hasPackets();
  }

  getScore(): number | null {
    return this.gameState?.getStatus().score ?? null;
  }

  getGameState(): GameState | undefined {
    return this.gameState;
  }

  getRecoveryPacket(): BinaryEncoder {
    if (!this.gameState) throw new Error("Cannot get recovery packet without game state");

    const recoverySchema = this.gameState.generateRecoveryPacket();
    return new GameRecoveryPacket().toBinaryEncoder(recoverySchema);
  }

  addSessionPacketSentTo(sessionID: string) {
    this.sessionsPacketsSentTo.add(sessionID);
  }

  hasSessionPacketSentTo(sessionID: string): boolean {
    return this.sessionsPacketsSentTo.has(sessionID);
  }

}

export class Room {

  private players: RoomUser[] = [];
  private spectators: RoomUser[] = [];
  public readonly roomID: string;
  public readonly mode: RoomMode;

  public multiplayer?: MultiplayerManager;

  constructor(playerSessions: UserSession[]) {
    if (playerSessions.length < 1 || playerSessions.length > 2) {
      throw new Error("Room must have 1 or 2 players");
    }

    this.players.push(new RoomUser(this, playerSessions[0], Role.PLAYER_1));
    
    if (playerSessions.length === 1) {
      this.mode = RoomMode.SOLO;
    } else { // 2 players
      this.mode = RoomMode.MULTIPLAYER;
      this.players.push(new RoomUser(this, playerSessions[1], Role.PLAYER_2));
    }

    this.roomID = uuid();
  }

  async init() {

    if (this.mode == RoomMode.SOLO) {

    } else {
      const isRanked = true; // TEMPORARY
      this.multiplayer = new MultiplayerManager(
        isRanked,
        this.players[0].session,
        this.players[1].session,
        (data: MultiplayerData) => {
          // send the room state and match result to all players in the room
          const message = new MultiplayerRoomUpdateMessage(this.roomID, data);
          this.sendJsonMessageToAllUsers(message);
      });

      await this.multiplayer.init();
    }

  }

  addSpectator(session: UserSession): RoomUser {

    if (this.spectators.find(player => player.session.user.username === session.user.username)) {
      throw new Error(`User ${session.user.username} is already in this room`);
    }

    const newUser = new RoomUser(this, session, Role.SPECTATOR);
    this.spectators.push(newUser);
    return newUser;
  }

  get allRoomUsers(): RoomUser[] {
    return this.players.concat(this.spectators);
  }

  // remove a user from the room. returns true if the room is now empty and should be deleted
  async removeUser(roomUser: RoomUser): Promise<boolean> {

    // if user had a game in progress, save the game state to the database
    if (roomUser.isInGame()) await this.endGame(roomUser);

    // if the user is a player, handle the player leaving the room in multiplayer
    if (this.multiplayer && isPlayer(roomUser.role)) {
      this.multiplayer.onPlayerLeaveRoom(roomUser.role as PlayerRole, roomUser.getScore());
    }

    // remove the user from the room
    this.players = this.players.filter(player => player !== roomUser);
    this.spectators = this.spectators.filter(spectator => spectator !== roomUser);

    console.log(`User ${roomUser.session.user.username} removed from room ${this.roomID}`);

    // Check if user is still in any other rooms. if not, set user status to IDLE
    roomUser.session.user.onLeaveRoom();

    // return true if the room is now empty
    return this.allRoomUsers.length === 0;
  }

  getUserBySocket(socket: WebSocket): RoomUser | undefined {
    return this.allRoomUsers.find(player => player.session.socket === socket);
  }

  getUserByUserID(userid: string): RoomUser | undefined {
    return this.allRoomUsers.find(player => player.session.user.userid === userid);
  }

  getUserBySessionID(sessionID: string): RoomUser | undefined {
    return this.allRoomUsers.find(player => player.session.user.sessionID === sessionID);
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

    // prefix packet data with the RoomUser's index
    const encoderPrefix = new BinaryEncoder();
    const playerIndex = this.players.indexOf(roomUser);
    encoderPrefix.addUnsignedInteger(playerIndex, MAX_PLAYER_BITCOUNT);

    // For any users that haven't recieved any packets from this player yet, send recovery packets to those users
    if (roomUser.isInGame()) {

      const recoveryEncoder = encoderPrefix.copy();
      recoveryEncoder.addBinaryEncoder(roomUser.getRecoveryPacket());
      const recoveryMessage = recoveryEncoder.convertToUInt8Array();

      this.allRoomUsers.forEach(player => {
        if (!player.hasSessionPacketSentTo(roomUser.session.user.sessionID)) {
          console.log(`Player ${player.session.user.username} hasn't received packets from player ${roomUser.session.user.username}, sending recovery packet`);
          player.sendBinaryMessage(recoveryMessage);
        }
      });
    } else {
      console.log(`Player ${roomUser.session.user.username} is not already in a game, not sending recovery packets`);
    }
    
    // resend the binary message to all players in the room, except the user
    const packetsEncoder = encoderPrefix.copy();
    packetsEncoder.addBinaryDecoder(BinaryDecoder.fromUInt8Array(packets.stream));
    this.sendBinaryMessageToAllUsersExcept(roomUser, packetsEncoder);

    // save the session ID of the user that the packets were sent to
    this.allRoomUsers.forEach(player => player.addSessionPacketSentTo(roomUser.session.user.sessionID));
    
    // go through each packet in the stream and cache packets that are within a game
    let packetsReceived = 0;
    while (packets.hasMorePackets()) {
      const packetContent = packets.nextPacket();
      packetsReceived++;

      console.log(`Received packet ${packetContent.opcode} from player ${roomUser.session.user.username}: ${packetContent.content}`);

      if (packetContent.opcode === PacketOpcode.GAME_START) {
        // reset the game packets cache when a new game starts
        roomUser.resetGame();

        if (this.multiplayer) {
          // if this is a multiplayer room, check if game start is legal, and if so, cache the game start packet
          const startGame = this.multiplayer.onGameStartPacket(roomUser.role as PlayerRole);
          if (startGame) {
            roomUser.addGamePacket(packetContent);
            console.log(`Player ${roomUser.session.user.username} started a legal multiplayer game`);
          } else {
            console.log(`Player ${roomUser.session.user.username} tried to start an illegal multiplayer game, ignoring game start packet`);
          }
        } else { // in solo mode, always cache the game start packet
          roomUser.addGamePacket(packetContent);
          console.log(`Player ${roomUser.session.user.username} started a solo game`);
        }

      } else if (roomUser.isInGame()) {
        // If user is already in a game, cache the game packets
        roomUser.addGamePacket(packetContent);
      }

      // if this packet ends the game, save the game state to the database and clear the cache
      // we don't need to add the game end packet to the packet list
      if (packetContent.opcode === PacketOpcode.GAME_END) {
        console.log(`Player ${roomUser.session.user.username} ended the game`);
        await this.endGame(roomUser);
      }
    }
    console.log(`Received ${packetsReceived} packets from player ${roomUser.session.user.username}`);
  }

  // When game ends, whether by GAME_END packet or player leaving, end game for roomUser
  // possibly save game to database. multiplayer will not save if game is not legal
  private async endGame(roomUser: RoomUser) {

    if (!roomUser.isInGame()) throw new Error("Cannot end game for user not in game");

    let gameID: string | null = null;

    if (this.multiplayer) {
      const score = roomUser.getScore();
      if (score === null) throw new Error("Game end packet received without a score");
      gameID = this.multiplayer.onGameEndPacket(roomUser.role as PlayerRole, score);
    } else {
      // We always save the game in solo mode. Make a new game ID
      gameID = uuid();
    }

    if (gameID) {
      const gameState = roomUser.getGameState()!;
      const gamePackets = roomUser.popCachedGameBinaryData();
      console.log(`Saving ended game ${gameID} with ${gamePackets.length} bytes from player ${roomUser.session.user.username}`);
      await this.saveGameToDatabase(gameID, roomUser, gamePackets, gameState);
    } else {
      console.log("Game end packet received, but not saving game");
    }

  }

  // given all the packets of a game for a user, save the game state to the database
  async saveGameToDatabase(gameID: string, roomUser: RoomUser, gameBinaryData: Uint8Array, gameState: GameState) {
    // TODO: save game state to database
    console.log(`Saving game ${gameID} for player ${roomUser.session.user.username}`);

    // For solo games, send the game state to the user
    if (this.mode === RoomMode.SOLO) {
      roomUser.sendJsonMessage(new SoloGameEndMessage(gameID,
        gameState.getStatus().score,
        gameState.getStatus().lines,
        gameState.getNumTetrises()
      ));
      console.log(`Sent game end message to player ${roomUser.session.user.username} for game ${gameID} with score ${gameState.getStatus().score}`);
    }
    
  }

  // send a binary message to all players in the room, except the specified user
  // useful for broadcasting game state updates
  sendBinaryMessageToAllUsersExcept(roomUser: RoomUser, encoder: BinaryEncoder) {
    this.allRoomUsers.filter(player => player !== roomUser).forEach(player => player.sendBinaryMessage(encoder.convertToUInt8Array()));
  }

  sendJsonMessageToAllUsersExcept(roomUser: RoomUser, message: JsonMessage) {
    this.allRoomUsers.filter(player => player !== roomUser).forEach(player => player.sendJsonMessage(message));
  }

  sendJsonMessageToAllUsers(message: JsonMessage) {
    this.allRoomUsers.forEach(player => player.sendJsonMessage(message));
  }

  isEmpty(): boolean {
    return this.allRoomUsers.length === 0;
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