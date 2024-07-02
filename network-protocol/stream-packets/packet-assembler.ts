import { BinaryEncoder } from "../binary-codec";
import { LastPacket, Packet } from "./packet";

export const MAX_PLAYERS_IN_ROOM = 2;
export const MAX_PLAYER_BITCOUNT = 8;

// Assemble a stream of packets into a single stream
// A stream of packets stored in PacketAssembler is prefixed by the player index of the room
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

  // if desired to encode the player index, pass the player index as an argument
  // If passed in, must pass true to containsPlayerIndexPrefix in the PacketDisassembler constructor
  encode(playerIndex?: number): Uint8Array {

    const encoder = new BinaryEncoder();

    // prefix with the player index
    if (playerIndex !== undefined) {
      encoder.addUnsignedInteger(playerIndex, MAX_PLAYER_BITCOUNT);
    }

    // add all the packets to the encoder
    encoder.addBinaryEncoder(this.encoder);

    // add last packet to the encoder to signal the end of the stream
    // we can't rely on just checking if there are bits left, because the bits are padded to the nearest byte
    encoder.addBinaryEncoder(new LastPacket().toBinaryEncoder({}));

    return encoder.convertToUInt8Array();
  }
}