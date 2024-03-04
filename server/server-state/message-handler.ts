import { ErrorMessage, FetchPuzzleRequestMessage, FetchPuzzleResponseMessage, JsonMessage, JsonMessageType, PingMessage, PongMessage } from "../../network-protocol/json-message";
import { ServerState } from "./server-state";
import { OnlineUser } from "./online-user";
import { contains } from "../../misc/array-functions";
import { FriendInfo, FriendStatus } from "../../network-protocol/models/friends";
import { makePostRequestToPuzzleMicroservice } from "../puzzles/puzzle-microservice-api";
import { IActivePuzzleSchema, IPuzzleSolutionSchema } from "../puzzles/puzzle-microservice-models";

/*
Handles messages from the client sent by OnlineUser
*/
export async function handleJsonMessage(state: ServerState, author: OnlineUser, message: JsonMessage) {
    
    switch (message.type) {
        case JsonMessageType.PING: return await handlePingMessage(state, author, message as PingMessage);
        case JsonMessageType.FETCH_PUZZLE_REQUEST: return await handleFetchPuzzleRequestMessage(state, author, message as FetchPuzzleRequestMessage);
        default: console.log(`Unknown message type: ${message.type}`);
    }
}

// when ping is received, send pong back to author
export async function handlePingMessage(state: ServerState, author: OnlineUser, message: PingMessage) {
    author.sendJsonMessage(new PongMessage());
}

// when client requests for a puzzle, send POST request to puzzles microservice with puzzle response
export async function handleFetchPuzzleRequestMessage(state: ServerState, author: OnlineUser, message: FetchPuzzleRequestMessage) {

    try {
        const puzzle = (await makePostRequestToPuzzleMicroservice(
            "/api/fetch-puzzle-for-user",
            {'username': author.username}
        )) as IActivePuzzleSchema;

        author.sendJsonMessage(new FetchPuzzleResponseMessage(puzzle))
    } catch (error: any) {
        author.sendJsonMessage(new FetchPuzzleResponseMessage(undefined, error.message));
    }
    
}