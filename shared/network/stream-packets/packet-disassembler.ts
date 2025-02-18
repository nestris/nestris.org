import { BinaryDecoder, BinaryEncoder } from "../binary-codec";
import { OPCODE_BIT_LENGTH, PACKET_CONTENT_LENGTH, PACKET_MAP, PacketContent, PacketOpcode } from "./packet";
import { MAX_PLAYERS_IN_ROOM, MAX_PLAYER_BITCOUNT } from "./packet-assembler";

// Decode a stream of packets encoded by PacketAssembler
// Note that the player index is only specified if the stream is prefixed by the player index
export class PacketDisassembler {

  private decoder: BinaryDecoder;
  private playerIndex?: number = undefined;
  public readonly bitcount: number;

  constructor(public readonly stream: Uint8Array, containsPlayerIndexPrefix: boolean) {

    // convert stream to string of 0s and 1s
    this.decoder = BinaryDecoder.fromUInt8Array(stream);

    this.bitcount = this.decoder.numBitsLeft();

    // read the player index
    if (containsPlayerIndexPrefix) {
      this.playerIndex = this.decoder.nextUnsignedInteger(MAX_PLAYER_BITCOUNT);
    }

  }

  printBits() {
    console.log(this.decoder.bits);
  }

  printRemainingBits() {
    console.log(this.decoder.remainingBits);
  }

  // only specified if containsPlayerIndexPrefix is true
  getPlayerIndex(): number | undefined {
    return this.playerIndex;
  }


  hasMorePackets(): boolean {
    // the last packet of the stream is a special packet with opcode LAST_PACKET_OPCODE
    return this.decoder.hasMore() && this.decoder.nextUnsignedInteger(OPCODE_BIT_LENGTH, false) !== PacketOpcode.LAST_PACKET_OPCODE;
  }

  nextPacket(): PacketContent {

    const decoderCopy = this.decoder.copy();

    // read the opcode
    const opcode = this.decoder.nextUnsignedInteger(OPCODE_BIT_LENGTH) as PacketOpcode;
    //console.log("Opcode", opcode);

    // get the packet class from the opcode
    const packet = PACKET_MAP[opcode];

    //console.log("Bits left", this.decoder.numBitsLeft());

    if (!packet) throw new Error(`Unknown opcode ${opcode}`);
    
    // decode the packet content
    const content = packet.decodePacket(this.decoder);

    // recover the binary
    const packetLength = OPCODE_BIT_LENGTH + PACKET_CONTENT_LENGTH[opcode]!; // the length of opcode+content
    const binaryBits = decoderCopy.nextBinaryString(packetLength);
    const binary = new BinaryEncoder();
    binary.addBinaryString(binaryBits);

    return { opcode, content, binary };
  }

}