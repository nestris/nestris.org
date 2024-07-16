import { get } from "http";
import { BinaryEncoder } from "network-protocol/binary-codec";
import { PacketContent, getPacketDelay } from "network-protocol/stream-packets/packet";

/*
Given a stream of PacketSchema, some of them TimedPacketSchema, process these packets respecting 
the fixed delays of the TimedPacketSchema. In addition, buffer the packets for a fixed amount of time
to minimize the impact of network jitter. Accumulated roundoff errors are avoided by using the initial
time as a baseline.
*/
export class PacketReplayer {

  private buffer = new Array<PacketContent>();
  private initialTime?: number = undefined;
  private timeToExecutePacket: number;


  constructor(
    // callback will be called when it is time for the upcoming packet(s) to execute
    // multiple packets means that some or all of them are not timed, so they execute immediately
    private readonly executePackets: (packets: PacketContent[]) => void,
    private readonly bufferDelay: number, // buffer packets this amount in ms before executing to avoid network jitter
  ) {
    this.timeToExecutePacket = bufferDelay;
  }

  ingestPacket(packet: PacketContent): void {

    if (this.initialTime === undefined) {
      this.initialTime = performance.now();
    }

    this.buffer.push(packet);

    // if buffer was empty before and only now has a packet, means there is no packet queued
    // so we start queue this packet
    if (this.buffer.length === 1) this.sendQueuedPacket();
  }

  sendQueuedPacket(forceExecuteFirst: boolean = false) {

    // assert there is a packet to send
    if (this.buffer.length === 0) throw new Error("No packet to send");

    const queuedPacket = this.buffer[0];

    const delay = getPacketDelay(queuedPacket);

    if (delay && !forceExecuteFirst) {

      if (delay < 2000) {
        // under normal conditions, a frame lasts well under two seconds. in this case, we calculate
        // time to execute the packet using initialTime to avoid roundoff errors
        this.timeToExecutePacket += delay;     
      } else {
        // if the delay is too large, we reset initialTime, especially in case delay overflows
        // in this case, currentTime will compute to 0, and the timeToWait will just be buffer delay
        // essentially, we are resetting
        console.log("Packet delay too long; resetting initial time");
        this.initialTime = performance.now();
        this.timeToExecutePacket = this.bufferDelay;
      }

      const currentTime = performance.now() - this.initialTime!;
      const timeToWait = this.timeToExecutePacket - currentTime;

      if (timeToWait > 0) {
        // if the queued packet is a timed packet and we have to wait, set a timeout
        setTimeout(() => this.sendQueuedPacket(true), timeToWait);
        return;
      }
    }

    // If here, means that we can execute this packet
    const packetsToExecute = [queuedPacket];
    this.buffer.shift();

    // check if there are more non-timed packets to execute
    while (this.buffer.length > 0 && getPacketDelay(this.buffer[0]) === undefined) {
      packetsToExecute.push(this.buffer.shift()!);
    }

    // execute the packets maintaining order
    this.executePackets(packetsToExecute);

    // queue the next packet, if it exists
    if (this.buffer.length > 0) this.sendQueuedPacket();
  }
}

let opcode = 0;
function getTestPacket(delta: number | undefined): PacketContent {

  return {
    opcode: opcode++,
    binary: new BinaryEncoder(),
    content: delta ? { delta } : {},
  }
}


export function testPacketReplayer() {

  const packets = [
    getTestPacket(100),
    getTestPacket(undefined),
    getTestPacket(200),
    getTestPacket(100),
    getTestPacket(undefined),
    getTestPacket(100),
    getTestPacket(undefined),
    getTestPacket(200),
    getTestPacket(100),
    getTestPacket(300),
    getTestPacket(200),
    getTestPacket(undefined),
    getTestPacket(1000),
    getTestPacket(10)
  ];

  packets.forEach((packet) => {
    console.log("Init packet", packet.opcode, "Delay", getPacketDelay(packet));
  
  })


  const initialTime = performance.now();
  
  const packetReplayer = new PacketReplayer((packets) => {
    packets.forEach((packet) => {
      console.log("Packet", packet.opcode, "Time", performance.now() - initialTime);
    });
  }, 500);

  // send the first 5 packets, then after 2000ms, send the rest
  packets.slice(0, 5).forEach((packet) => packetReplayer.ingestPacket(packet));
  setTimeout(() => {
    packets.slice(5).forEach((packet) => packetReplayer.ingestPacket(packet));
  }, 2000);
}