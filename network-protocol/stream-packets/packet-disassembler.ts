import { BinaryDecoder } from "network-protocol/binary-codec";
import { OPCODE_BIT_LENGTH, PACKET_MAP, PacketOpcode } from "./packet";

export class PacketDisassembler {

  private decoder: BinaryDecoder;

  constructor(stream: Uint8Array) {

    // convert stream to string of 0s and 1s
    const binaryString = stream.reduce((acc, byte) => acc + byte.toString(2), '');
    this.decoder = new BinaryDecoder(binaryString);

  }

  printBits() {
    console.log(this.decoder.bits);
  }

  hasMorePackets(): boolean {
    return this.decoder.hasMore();
  }

  nextPacket(): {
    opcode: PacketOpcode;
    content: any; // defined by generic of Packet subclass
  } {

    // read the opcode
    const opcode = this.decoder.nextUnsignedInteger(OPCODE_BIT_LENGTH) as PacketOpcode;

    // get the packet class from the opcode
    const packet = PACKET_MAP[opcode];

    if (!packet) throw new Error(`Unknown opcode ${opcode}`);
    
    // decode the packet content
    const content = packet.decodePacket(this.decoder);
    return { opcode, content };
  }

}