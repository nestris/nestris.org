import { ErrorMessage, JsonMessage, JsonMessageType, PingMessage, PongMessage, StartSoloRoomMessage } from "../../network-protocol/json-message";
import { ServerState } from "./server-state";
import { OnlineUser } from "./online-user";
import { contains } from "../../misc/array-functions";
import { FriendInfo, FriendStatus } from "../../network-protocol/models/friends";
import { PacketDisassembler } from "network-protocol/stream-packets/packet-disassembler";
import { Socket } from "dgram";

/*
Handles messages from the client sent by OnlineUser
*/
export async function handleJsonMessage(state: ServerState, user: OnlineUser, socket: WebSocket, message: JsonMessage) {
    
    switch (message.type) {
        case JsonMessageType.PING: return await handlePingMessage(state, socket, message as PingMessage);
        case JsonMessageType.START_SOLO_ROOM: return await handleStartSoloRoomMessage(state, user, socket, message as StartSoloRoomMessage);
        default: console.log(`Unknown message type: ${message.type}`);
    }
}

// when ping is received, send pong back to author
export async function handlePingMessage(state: ServerState, socket: WebSocket, message: PingMessage) {
    socket.send(JSON.stringify(new PongMessage()));
}

// when user wants to start a solo room, create a room for the user
// returns sucess if user not already in a room, and so creates a room
export async function handleStartSoloRoomMessage(state: ServerState, user: OnlineUser, socket: WebSocket, message: StartSoloRoomMessage) {

    try {
        // try to create a room for the user
        state.roomManager.createSingleplayerRoom(user.username, socket);
        socket.send(JSON.stringify(new StartSoloRoomMessage(message.id, true))); // send success message
    } catch (error) {
        // if user is already in a room, send an error message
        socket.send(JSON.stringify(new StartSoloRoomMessage(message.id, false)));
    }
}

