import { ErrorMessage, JsonMessage, JsonMessageType, PingMessage, PongMessage } from "../../network-protocol/json-message";
import { ServerState } from "./server-state";
import { OnlineUser } from "./online-user";
import { contains } from "../../misc/array-functions";
import { FriendInfo, FriendStatus } from "../../network-protocol/models/friends";
import { PacketDisassembler } from "network-protocol/stream-packets/packet-disassembler";

/*
Handles messages from the client sent by OnlineUser
*/
export async function handleJsonMessage(state: ServerState, author: OnlineUser, message: JsonMessage) {
    
    switch (message.type) {
        case JsonMessageType.PING: return await handlePingMessage(state, author, message as PingMessage);
        default: console.log(`Unknown message type: ${message.type}`);
    }
}

// when ping is received, send pong back to author
export async function handlePingMessage(state: ServerState, author: OnlineUser, message: PingMessage) {
    author.sendJsonMessage(new PongMessage());
}

export async function handleBinaryMessage(state: ServerState, author: OnlineUser, packets: PacketDisassembler) {

    console.log("Received binary message", packets.printBits());
    while (packets.hasMorePackets()) {
        const {opcode, content} = packets.nextPacket();
        console.log("Opcode", opcode);
        console.log("Content", content);
    }

}