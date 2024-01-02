import { JsonMessage, JsonMessageType, PingMessage, PongMessage } from "../../network-protocol/json-message";
import { ServerState } from "./server-state";
import { OnlineUser } from "./online-user";

/*
Handles messages from the client sent by OnlineUser
*/
export function handleJsonMessage(state: ServerState, author: OnlineUser, message: JsonMessage) {
    
    switch (message.type) {
        case JsonMessageType.PING: return handlePingMessage(state, author, message);
        default: console.log(`Unknown message type: ${message.type}`);
    }
}

// when ping is received, send pong back to author
export function handlePingMessage(state: ServerState, author: OnlineUser, message: PingMessage) {
    author.sendJsonMessage(new PongMessage());
}