import { BinaryEncoder } from "../shared/network/binary-codec";
import { PacketContent, getPacketDelay } from "../shared/network/stream-packets/packet";
import { PeriodicTask } from "../shared/scripts/periodic-task";
import { RollingAverage, RollingAverageStrategy } from "../shared/scripts/rolling-average";

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

  private previousPacketTime: number = performance.now();


  // track the percentage of packets that were on time so that we can monitor performance and adjust buffer delay
  private onTimePackets: RollingAverage = new RollingAverage(50, RollingAverageStrategy.DELTA);
  private dynamicBufferTask: PeriodicTask;

  constructor(
    // callback will be called when it is time for the upcoming packet(s) to execute
    // multiple packets means that some or all of them are not timed, so they execute immediately
    private readonly executePackets: (packets: PacketContent[]) => void,
    private readonly initialBufferDelay: number, // buffer packets to minimize impact of network jitter
  ) {
    this.timeToExecutePacket = this.initialBufferDelay;

    // periodically adjust the buffer delay based on the percentage of on-time packets
    this.dynamicBufferTask = new PeriodicTask(50, () => this.adjustBufferDelay());
  }


  ingestPacket(packet: PacketContent): void {

    if (this.initialTime === undefined) {
      this.initialTime = performance.now();
    }

    this.buffer.push(packet);

    // if buffer was empty before and only now has a packet, means there is no packet queued
    // so we start queue this packet
    if (this.buffer.length === 1) this.sendQueuedPacket();

    // Every N cycles, adjust the buffer delay based on the percentage of packets that were on time
    this.dynamicBufferTask.execute();
  }

  sendQueuedPacket(forceExecuteFirst: boolean = false) {

    // assert there is a packet to send
    if (this.buffer.length === 0) console.log("WARNING: No packet to send.");

    const queuedPacket = this.buffer[0];

    const delay = getPacketDelay(queuedPacket);

    if (delay && !forceExecuteFirst) {

      const timeSinceLastPacket = performance.now() - this.previousPacketTime;
      if (timeSinceLastPacket < 2000) {
        // under normal conditions, a frame lasts well under two seconds. in this case, we calculate
        // time to execute the packet using initialTime to avoid roundoff errors
        this.timeToExecutePacket += delay;     
      } else {
        // if the delay is too large, we reset initialTime, especially in case delay overflows
        // in this case, currentTime will compute to 0, and the timeToWait will just be buffer delay
        // essentially, we are resetting
        console.log(`Long time since last packet at ${timeSinceLastPacket/1000}ms, resetting initial time`);
        this.initialTime = performance.now();
        this.timeToExecutePacket = this.initialBufferDelay;
        this.onTimePackets.reset();
      }

      const currentTime = performance.now() - this.initialTime!;
      const timeToWait = this.timeToExecutePacket - currentTime;

      if (timeToWait > 0) {
        // there's time before packet needs to be executed, so packet came on time
        this.onTimePackets.push(1);

        // if the queued packet is a timed packet and we have to wait, set a timeout
        setTimeout(() => this.sendQueuedPacket(true), timeToWait);
        return;
      } else {
        // packet is late
        this.onTimePackets.push(0);
      }
    }

    // If here, means that we can execute this packet
    const packetsToExecute = [queuedPacket];
    this.buffer.shift();

    // update the previous packet time if this packet was a timed packet
    if (getPacketDelay(queuedPacket)) this.previousPacketTime = performance.now();

    // check if there are more non-timed packets to execute
    while (this.buffer.length > 0 && getPacketDelay(this.buffer[0]) === undefined) {
      packetsToExecute.push(this.buffer.shift()!);
    }

    // execute the packets maintaining order
    this.executePackets(packetsToExecute);
    
    // queue the next packet, if it exists
    if (this.buffer.length > 0) this.sendQueuedPacket();
  }

  percentagePacketsOnTime(): number {
    return this.onTimePackets.get();
  }

  packetsOnTimeHistory(): number[] {
    return this.onTimePackets.getValues();
  }

  // Adjust the buffer delay based on the percentage of packets that were on time
  private adjustBufferDelay() {

    // wait until we have enough data to make a decision
    if (!this.onTimePackets.isFull()) return;

    const percentage = this.percentagePacketsOnTime();
    
    let delayAdjustment: number;
    if (percentage == 1) {
      // all packets are on time, so we can reduce the buffer delay
      delayAdjustment = -10;
    } else if (percentage > 0.90) {
      // most packets are on time, so we keep the buffer delay the same
      return;
    } else if (percentage > 0.7) {
      // some packets are late, so we increase the buffer delay
      delayAdjustment = 20;
    } else {
      // most packets are late, so we increase the buffer delay significantly
      delayAdjustment = 100;
    }

    // shift the current buffer delay
    this.timeToExecutePacket += delayAdjustment;
  
    console.log(`Packet reliability: ${percentage * 100}%. ${delayAdjustment > 0 ? "Increasing" : "Decreasing"} buffer delay by ${Math.abs(delayAdjustment)}ms`);
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