import { BinaryEncoder } from "../binary-codec";
import { LastPacket, Packet } from "./packet";

// Assemble a stream of packets into a single stream
export class PacketAssembler {
  
  private encoder: BinaryEncoder = new BinaryEncoder();

  addPacketContent(packetContent: BinaryEncoder) {
    // console.log(`Adding packet content to packet assembler (${packetContent.bitcount})`, packetContent.getBitString());
    this.encoder.addBinaryEncoder(packetContent);
  }

  // Returns true if there are packets to send
  hasPackets(): boolean {
    return this.encoder.bitcount > 0;
  }

  printBits() {
    console.log(this.encoder.getBitString());
  }

  encode(): Uint8Array {

    const encoder = this.encoder.copy();

    // add last packet to the encoder to signal the end of the stream
    // we can't rely on just checking if there are bits left, because the bits are padded to the nearest byte
    encoder.addBinaryEncoder(new LastPacket().toBinaryEncoder({}));

    return this.encoder.convertToUInt8Array();
  }
}