/*
Data sent over websocket as JSON. type is the only required field and specifies
the type of message being sent. All other fields are optional and depend on the
type of message being sent.
*/

export enum MessageType {
    // Client to server
    LOGIN = 'login',
    LOGOUT = 'logout',
}

export interface JsonMessage {
    type: MessageType;
}

export interface LoginMessage extends JsonMessage {
    // TODO
}