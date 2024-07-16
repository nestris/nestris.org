// Handles binary messages from server and decodes into current game state for players in the room

import { ChangeDetectorRef } from "@angular/core";
import { GameStateFromPackets } from "src/app/shared/game-state-from-packets/game-state-from-packets";
import { PacketContent, PACKET_NAME } from "src/app/shared/network/stream-packets/packet";
import { PacketReplayer } from "src/app/util/packet-replayer";


/*
Stores the most up-to-date-versions of each player's states from the room, and processes packets
from server that update each player's state. This is not a reactive object, so must notify for changes
manually after calling onPacket()
*/
export class ClientRoomState {

  // map between each player index and their current game state
  playerStates: GameStateFromPackets[] = [];
  playerPackets: PacketReplayer[] = [];

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly numPlayers: number,
    bufferDelay: number
  ) {

    // initialize the player state objects
    for (let i = 0; i < this.numPlayers; i++) {

      const playerState = new GameStateFromPackets();
      this.playerStates.push(playerState);

      // create a PacketReplayer for each player that will buffer packets from the server
      this.playerPackets.push(new PacketReplayer((packets) => {
        // when PacketReplayer decides it is time for a packet(s) to be executed,
        // update the player state with the packet(s)
        packets.forEach(packet => playerState.onPacket(packet));

        // notify the change detector that the player state has been updated
        this.cdr.detectChanges();
      }, bufferDelay));
    }

  }

  // when a packet is received from the server, queue it into the appropriate player's PacketReplayer
  onReceivePacket(packetIndex: number, packet: PacketContent) {

    // add the packet to the PacketReplayer queue, to be executed when the PacketReplayer decides
    console.log(`Received packet from player ${packetIndex}: ${PACKET_NAME[packet.opcode]} ${packet.content}`);
    this.playerPackets[packetIndex].ingestPacket(packet);

  }

  player(playerIndex: number): GameStateFromPackets {
    return this.playerStates[playerIndex];
  }

}