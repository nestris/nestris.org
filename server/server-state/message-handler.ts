import { JsonMessage, JsonMessageType, OnFriendRequestAcceptedMessage, PingMessage, PongMessage, SendFriendRequestMessage } from "../../network-protocol/json-message";
import { ServerState } from "./server-state";
import { OnlineUser } from "./online-user";
import { getUserByUsername, updateUser } from "../database/user/user-service";

/*
Handles messages from the client sent by OnlineUser
*/
export async function handleJsonMessage(state: ServerState, author: OnlineUser, message: JsonMessage) {
    
    switch (message.type) {
        case JsonMessageType.PING: return await handlePingMessage(state, author, message as PingMessage);
        case JsonMessageType.SEND_FRIEND_REQUEST: return await handleSendFriendRequestMessage(state, author, message as SendFriendRequestMessage);
        default: console.log(`Unknown message type: ${message.type}`);
    }
}

// when ping is received, send pong back to author
export async function handlePingMessage(state: ServerState, author: OnlineUser, message: PingMessage) {
    author.sendJsonMessage(new PongMessage());
}

// when a friend request is sent, update incoming and outgoing friend requests in database
// if recipent is online, send friend request socket message to recipient
export async function handleSendFriendRequestMessage(state: ServerState, author: OnlineUser, message: SendFriendRequestMessage) {

    const dbSender = await getUserByUsername(author.username);
    const dbRecipient = await getUserByUsername(message.potentialFriend);

    if (!dbSender || !dbRecipient) throw new Error("Could not find sender or recipient in database");

    if (dbSender.friends.includes(dbRecipient.username) || dbRecipient.friends.includes(dbSender.username)) {
        throw new Error("Sender and recipient are already friends");
    }

    if (dbSender.outgoingFriendRequests.includes(dbRecipient.username) || dbRecipient.incomingFriendRequests.includes(dbSender.username)) {
        throw new Error("Request already pending");
    }

    const bothSidesRequested = dbSender.incomingFriendRequests.includes(dbRecipient.username);

    // if recipient already sent sender a friend request, then make them friends
    if (bothSidesRequested) {
        dbSender.friends.push(dbRecipient.username);
        dbRecipient.friends.push(dbSender.username);
        dbSender.incomingFriendRequests = dbSender.incomingFriendRequests.filter((username) => username !== dbRecipient.username);
        dbRecipient.outgoingFriendRequests = dbRecipient.outgoingFriendRequests.filter((username) => username !== dbSender.username);
    } else { // otherwise, add the friend request to the database
        dbSender.outgoingFriendRequests.push(dbRecipient.username);
        dbRecipient.incomingFriendRequests.push(dbSender.username);
    }

    // save changes to database
    await updateUser(dbSender.username, dbSender);
    await updateUser(dbRecipient.username, dbRecipient);

    // get the recipient's OnlineUser object if they are online, or undefined if not
    const recipient = state.onlineUserManager.getOnlineUserByUsername(message.potentialFriend);
    
    // if made friends successfully, send friend status update to both users
    if (bothSidesRequested) {
        author.sendJsonMessage(new OnFriendRequestAcceptedMessage(message.potentialFriend));
        
        // if recipient is online, send friend status update to recipient
        if (recipient) {
            recipient.sendJsonMessage(new OnFriendRequestAcceptedMessage(author.username));
        }
    } else { // otherwise, send friend request to recipient if they are online
        if (recipient) {
            recipient.sendJsonMessage(new SendFriendRequestMessage(author.username));
        }
    }
}