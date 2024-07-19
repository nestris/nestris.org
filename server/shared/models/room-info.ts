export enum Role {
  PLAYER_1 = "PLAYER_1", // for solo, or player 1 in multiplayer. streams inputs to server
  PLAYER_2 = "PLAYER_2", // player 2 in multiplayer. streams inputs to server
  SPECTATOR = "SPECTATOR", // only receives game state updates
  REFEREE = "REFEREE", // recieves game state updates, and can also update match state
}
export const isPlayer = (role: Role) => role === Role.PLAYER_1 || role === Role.PLAYER_2;

export enum RoomMode {
  SOLO = "SOLO",
  MULTIPLAYER = "MULTIPLAYER",
}

// serialized information about the room
export interface RoomInfo {
  roomID: string;
  mode: RoomMode;
  players: {
    userid: number;
    username: string;
    sessionID: string;
    role: Role;
  }[];
}