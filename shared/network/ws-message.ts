import { BinaryDecoder } from "./binary-codec";
import { JsonMessage } from "./json-message";
import { PacketDisassembler } from "../stream-packets/packet-disassembler";

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
    JSON = "JSON",
    BINARY = "BINARY",
}

export async function decodeMessage(message: any, containsPlayerIndexPrefix: boolean): Promise<{type: MessageType, data: JsonMessage | PacketDisassembler}> {
    if (typeof message === 'string') {
        const jsonMessage = JSON.parse(message);
        return {
            type: MessageType.JSON,
            data: jsonMessage
        };

    }

    // try to decode as json if its an arraybuffer
    const messageString = message.toString('utf8');
    if (messageString) {
        try {
            const jsonMessage = JSON.parse(messageString);
            return {
                type: MessageType.JSON,
                data: jsonMessage
            };
        } catch {
            // do nothing
        }
    }

    if (message instanceof Blob) {
        // convert blob to arraybuffer
        message = await message.arrayBuffer();
    }
    
    return {
        type: MessageType.BINARY,
        data: new PacketDisassembler(new Uint8Array(message), containsPlayerIndexPrefix)
    };
}