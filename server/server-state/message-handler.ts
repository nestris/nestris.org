import { AcceptFriendRequestMessage, DeclineFriendRequestMessage, ErrorMessage, JsonMessage, JsonMessageType, OnFriendRequestAcceptedMessage, OnFriendRequestDeclinedMessage, OnSendFriendRequestMessage, PingMessage, PongMessage, SendFriendRequestMessage } from "../../network-protocol/json-message";
import { ServerState } from "./server-state";
import { OnlineUser } from "./online-user";
import { getUserByUsername, updateUser } from "../database/user/user-service";
import { contains } from "../../misc/array-functions";
import { FriendInfo, FriendStatus } from "../../network-protocol/models/friends";

/*
Handles messages from the client sent by OnlineUser
*/
export async function handleJsonMessage(state: ServerState, author: OnlineUser, message: JsonMessage) {
    
    switch (message.type) {
        case JsonMessageType.PING: return await handlePingMessage(state, author, message as PingMessage);
        case JsonMessageType.SEND_FRIEND_REQUEST: return await handleSendFriendRequestMessage(state, author, message as SendFriendRequestMessage);
        case JsonMessageType.ACCEPT_FRIEND_REQUEST: return await handleAcceptFriendRequestMessage(state, author, message as AcceptFriendRequestMessage);
        case JsonMessageType.DECLINE_FRIEND_REQUEST: return await handleDeclineFriendRequestMessage(state, author, message as DeclineFriendRequestMessage);
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

        // get XP and trophies of the recipient
        const friendUserInfo = await getUserByUsername(message.potentialFriend);
        if (friendUserInfo === undefined) {
            author.sendJsonMessage(new ErrorMessage(`Cannot send friend request; user ${message.potentialFriend} does not exist`));
            return;
        }

        const friendInfo = new FriendInfo(
            message.potentialFriend,
            FriendStatus.PENDING,
            state.onlineUserManager.getOnlineStatus(message.potentialFriend),
            friendUserInfo.xp, friendUserInfo.trophies
        );
        author.sendJsonMessage(new OnSendFriendRequestMessage(friendInfo));
        if (recipient) {
            recipient.sendJsonMessage(new SendFriendRequestMessage(author.username));
        }
    }
}

// sent when a user accepts friend request from another user
export async function handleAcceptFriendRequestMessage(state: ServerState, author: OnlineUser, message: AcceptFriendRequestMessage) {

    const dbAccepter = await getUserByUsername(author.username);
    const dbRequester = await getUserByUsername(message.requesterUsername);

    if (!dbAccepter || !dbRequester) throw new Error("Could not find sender or recipient in database");

    // assert that author actually had an incoming request
    if (!contains(dbAccepter?.incomingFriendRequests, dbRequester.username)) throw new Error(`Cannot accept friend request, ${dbRequester.username} did not send a request to ${dbAccepter.username}`);

    // this is a valid request. remove the incoming/outgoing friends and convert to real friends
    dbRequester.outgoingFriendRequests = dbRequester.outgoingFriendRequests.filter((username) => username === dbAccepter.username);
    dbAccepter.incomingFriendRequests = dbAccepter.incomingFriendRequests.filter((username) => username === dbRequester.username);
    dbRequester.friends.push(dbAccepter.username);
    dbAccepter.friends.push(dbRequester.username);

    // save changes to database
    await updateUser(dbRequester.username, dbRequester);
    await updateUser(dbAccepter.username, dbAccepter);

    // send friend request accepted message to accepter
    author.sendJsonMessage(new OnFriendRequestAcceptedMessage(dbRequester.username));

    // get the requester's OnlineUser object if they are online, or undefined if not
    const requester = state.onlineUserManager.getOnlineUserByUsername(dbRequester.username);
    if (requester) requester.sendJsonMessage(new OnFriendRequestAcceptedMessage(dbAccepter.username));
}

// sent when a user declines friend request from another user
export async function handleDeclineFriendRequestMessage(state: ServerState, author: OnlineUser, message: DeclineFriendRequestMessage) {

    const dbDecliner = await getUserByUsername(author.username);
    const dbRequester = await getUserByUsername(message.requesterUsername);

    if (!dbDecliner || !dbRequester) throw new Error("Could not find sender or recipient in database");

    // assert that author actually had an incoming request
    if (!contains(dbDecliner?.incomingFriendRequests, dbRequester.username)) throw new Error(`Cannot decline friend request, ${dbRequester.username} did not send a request to ${dbDecliner.username}`);

    // this is a valid request. remove the incoming/outgoing friends
    dbRequester.outgoingFriendRequests = dbRequester.outgoingFriendRequests.filter((username) => username === dbDecliner.username);
    dbDecliner.incomingFriendRequests = dbDecliner.incomingFriendRequests.filter((username) => username === dbRequester.username);

    // save changes to database
    await updateUser(dbRequester.username, dbRequester);
    await updateUser(dbDecliner.username, dbDecliner);

    // send friend request accepted message to accepter
    author.sendJsonMessage(new OnFriendRequestDeclinedMessage(dbRequester.username));

    // get the requester's OnlineUser object if they are online, or undefined if not
    const requester = state.onlineUserManager.getOnlineUserByUsername(dbRequester.username);
    if (requester) requester.sendJsonMessage(new OnFriendRequestDeclinedMessage(dbDecliner.username));

}