import { BinaryEncoder } from "network-protocol/binary-codec";
import { Packet } from "./packet";

// Assemble a stream of packets into a single stream
export class PacketAssembler {
  
  private encoder: BinaryEncoder = new BinaryEncoder();

  addPacketContent(packetContent: BinaryEncoder) {
    this.encoder.addBinaryEncoder(packetContent);
  }

  printBits() {
    console.log(this.encoder.getBitString());
  }

  encode(): Uint8Array {
    return this.encoder.convertToUInt8Array();
  }
}