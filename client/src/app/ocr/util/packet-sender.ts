import { BinaryEncoder } from "../../shared/network/binary-codec";

export abstract class PacketSender {

    private bufferedPackets: BinaryEncoder[] = [];

    abstract sendPacket(packet: BinaryEncoder): void;

    bufferPacket(packet: BinaryEncoder) {
        this.bufferedPackets.push(packet);
    }

    /**
     * Sends all buffered packets and clears the buffer
     * @returns The previously buffered packets
     */
    sendBufferedPackets(): BinaryEncoder[] {
        for (const packet of this.bufferedPackets) {
            this.sendPacket(packet);
        }
        const previousBufferedPackets = this.bufferedPackets;
        this.bufferedPackets = [];

        return previousBufferedPackets
    }

}