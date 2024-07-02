// Handles binary messages from server and decodes into current game state for players in the room

import { GameStateFromPackets } from "network-protocol/game-state-from-packets/game-state-from-packets";
import { PacketContent } from "network-protocol/stream-packets/packet";


/*
Stores the most up-to-date-versions of each player's states from the room, and processes packets
from server that update each player's state. This is not a reactive object, so must notify for changes
manually after calling onPacket()
*/
export class ClientRoomState {

  // map between each player index and their current game state
  players: GameStateFromPackets[] = [];

  constructor(
    private readonly numPlayers: number,
  ) {

    // initialize the player state objects
    for (let i = 0; i < this.numPlayers; i++) {
      this.players.push(new GameStateFromPackets());
    }

  }

  onPacket(packetIndex: number, packet: PacketContent) {

    // get the player state and update it with the packet
    const player = this.players[packetIndex];
    player.onPacket(packet);

  }

  player(playerIndex: number): GameStateFromPackets {
    return this.players[playerIndex];
  }

}