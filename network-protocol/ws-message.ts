import { BinaryDecoder } from "./binary-codec";
import { JsonMessage } from "./json-message";

/*
A websocket message is sent in one of two formats:

As a STRING, which is a stringified JSON with the following format:
{
    "type": string
    ...
}

or as BINARY, which means its for realtime game/board data, following protocol defined in datum.ts
*/
export enum MessageType {
    JSON,
    BINARY
}

export function decodeMessage(message: any): {type: MessageType, data: JsonMessage | BinaryDecoder} {
    if (typeof message === 'string') {
        const jsonMessage = JSON.parse(message);
        return {
            type: MessageType.JSON,
            data: jsonMessage
        };
    } else if (message instanceof Uint8Array) {
        return {
            type: MessageType.BINARY,
            data: BinaryDecoder.fromUInt8Array(message)
        };
    } else {
        throw new Error('Unknown message type');
    }
}