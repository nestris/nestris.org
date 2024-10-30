
// Interface for sending serialized information of OnlineUser from server to client
export interface OnlineUserInfo {
  userid: string;
  username: string;
  isOnline: boolean;
  connectTime: number,
  sessions: string[],
  roomID?: string, // if user is playing in a room, this is the room id
}