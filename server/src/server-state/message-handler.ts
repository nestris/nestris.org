import { JsonMessage, JsonMessageType, PingMessage, StartSoloRoomMessage, StartSpectateRoomMessage, PongMessage } from "../../shared/network/json-message";
import { UserSession } from "./online-user";
import { ServerState } from "./server-state";

/*
Handles messages from the client sent by OnlineUser
*/
export async function handleJsonMessage(state: ServerState, session: UserSession, message: JsonMessage) {
    
    switch (message.type) {
        case JsonMessageType.PING: return await handlePingMessage(state, session, message as PingMessage);
        case JsonMessageType.START_SOLO_ROOM: return await handleStartSoloRoomMessage(state, session, message as StartSoloRoomMessage);
        case JsonMessageType.START_SPECTATE_ROOM: return await handleStartSpectateRoomMessage(state, session, message as StartSpectateRoomMessage);
            
        default: console.log(`Unknown message type: ${message.type}`);
    }
}

// when ping is received, send pong back to author
export async function handlePingMessage(state: ServerState, session: UserSession, message: PingMessage) {
    session.socket.send(JSON.stringify(new PongMessage()));
}

// when user wants to start a solo room, create a room for the user
// returns sucess if user not already in a room, and so creates a room
export async function handleStartSoloRoomMessage(state: ServerState, session: UserSession, message: StartSoloRoomMessage) {

    if (!message.success) { // this means user is trying to leave a room instead
        await state.roomManager.removeSocket(session.socket);
        return;
    }

    try {
        // try to create a room for the user
        const roomID = await state.roomManager.createSingleplayerRoom(session);
        session.socket.send(JSON.stringify(new StartSoloRoomMessage(message.id, true, roomID))); // send success message with room id
    } catch (error) {
        // if user is already in a room, send an error message
        session.socket.send(JSON.stringify(new StartSoloRoomMessage(message.id, false)));
    }
}

// when user wants to start spectating a room, add user to the room
export async function handleStartSpectateRoomMessage(state: ServerState, session: UserSession, message: StartSpectateRoomMessage) {
    state.roomManager.addSpectatorToRoom(message.roomID, session);
}