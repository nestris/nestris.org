import { BinaryDecoder } from "../binary-codec";
import { OPCODE_BIT_LENGTH, PACKET_MAP, PacketOpcode } from "./packet";

export class PacketDisassembler {

  private decoder: BinaryDecoder;

  constructor(stream: Uint8Array) {

    // convert stream to string of 0s and 1s
    this.decoder = BinaryDecoder.fromUInt8Array(stream);
    console.log("Bits decoded", this.decoder.numBitsLeft());

  }

  printBits() {
    console.log(this.decoder.bits);
  }

  hasMorePackets(): boolean {
    return this.decoder.hasMore() && this.decoder.nextUnsignedInteger(OPCODE_BIT_LENGTH, false) !== PacketOpcode.LAST_PACKET_OPCODE;
  }

  nextPacket(): {
    opcode: PacketOpcode;
    content: any; // defined by generic of Packet subclass
  } {

    // read the opcode
    const opcode = this.decoder.nextUnsignedInteger(OPCODE_BIT_LENGTH) as PacketOpcode;
    console.log("Opcode", opcode);

    // get the packet class from the opcode
    const packet = PACKET_MAP[opcode];
    console.log("Packet name", typeof packet);

    console.log("Bits left", this.decoder.numBitsLeft());

    if (!packet) throw new Error(`Unknown opcode ${opcode}`);
    
    // decode the packet content
    const content = packet.decodePacket(this.decoder);
    return { opcode, content };
  }

}