import { OnlineUserStatus } from "./friends";

// Interface for sending serialized information of OnlineUser from server to client
export interface OnlineUserInfo {
  userid: string;
  username: string;
  status: OnlineUserStatus;
  connectTime: number,
  sessions: string[],
  roomID?: string, // if user is playing in a room, this is the room id
}