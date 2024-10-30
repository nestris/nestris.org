// OLD, DO NOT USE

export enum OldRole {
  PLAYER_1 = "PLAYER_1", // for solo, or player 1 in multiplayer. streams inputs to server
  PLAYER_2 = "PLAYER_2", // player 2 in multiplayer. streams inputs to server
  SPECTATOR = "SPECTATOR", // only receives game state updates
  REFEREE = "REFEREE", // recieves game state updates, and can also update match state
}
export const isPlayer = (role: OldRole) => role === OldRole.PLAYER_1 || role === OldRole.PLAYER_2;

export enum OldRoomMode {
  SOLO = "SOLO",
  MULTIPLAYER = "MULTIPLAYER",
}

// serialized information about the room
export interface OldRoomInfo {
  roomID: string;
  mode: OldRoomMode;
  players: {
    userid: string;
    username: string;
    sessionID: string;
    role: OldRole;
  }[];
}