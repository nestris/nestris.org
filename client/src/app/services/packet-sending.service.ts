import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { DEFAULT_POLLED_GAME_DATA, PlatformInterfaceService, PolledGameData } from './platform-interface.service';
import { PacketAssembler } from 'network-protocol/stream-packets/packet-assembler';
import { NonGameBoardStateChangePacket } from 'network-protocol/stream-packets/packet';

/*
Sends tetris packets from PlatformInterfaceService to the server using websockets.
*/

@Injectable({
  providedIn: 'root'
})
export class PacketSendingService {

  // store the previous data to compare with the new data
  private previousData = DEFAULT_POLLED_GAME_DATA;

  private assembler = new PacketAssembler();

  constructor(
    private websocket: WebsocketService,
    private platform: PlatformInterfaceService
  ) {

    // every second, send all accumulated data to the server
    // batching packets reduces the number of websocket messages sent
    setInterval(() => {
      this.sendData();
    }, 1000);
    
    // when new data is received, save it to be sent to the server
    this.platform.getPolledGameData$().subscribe((data) => {
      this.onData(data);
    });
  }

  // called every second to send all accumulated data to the server
  private sendData() {

    // console.log("sendData()");

    // if there are no packets to send, don't do anything
    if (!this.assembler.hasPackets()) {
      console.log("No packets to send");
      return;
    }

    // encode the packets into Uint8Array, and send it to the server
    const binaryData = this.assembler.encode();
    this.websocket.sendBinaryMessage(binaryData);

    // clear the assembler for the next batch of packets
    this.assembler = new PacketAssembler();

  }

  // runs after each iteration of poll() in PlatformInterfaceService
  // If there is changed data, send it to the server
  private onData(data: PolledGameData) {

    // console.log("onData()", data);

    // for now, just check if the board is different, and if so, push it to the assembler
    if (!data.board.equals(this.previousData.board)) {
      this.assembler.addPacketContent(new NonGameBoardStateChangePacket().toBinaryEncoder({
        deltaMs: 0, // TODO
        board: data.board,
      }));
    }

    // TODO: check for other changes, and implement game/non-game state and packets


    this.previousData = data;
  }

}
