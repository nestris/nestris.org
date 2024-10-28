export enum Authentication {
  ADMIN = "admin", // full unrestricted access
  TRUSTED = "trusted",
  USER = "user",
  NONE = "none",
}

export const AUTHENTICATION_LEVEL = {
  [Authentication.ADMIN]: 3,
  [Authentication.TRUSTED]: 2,
  [Authentication.USER]: 1,
  [Authentication.NONE]: 0,
}

export interface DBUser {
  userid: string,
  username: string,
  is_guest: boolean,
  authentication: Authentication,
  created_at: Date,
  last_online: Date,

  league: number,
  xp: number,
  trophies: number,
  highest_trophies: number,

  puzzle_elo: number,
  highest_puzzle_elo: number,
  puzzles_attempted: number,
  puzzles_solved: number,
  puzzle_seconds_played: number,

  highest_score: number,
  highest_level: number,
  highest_lines: number,

  highest_transition_into_19: number,
  highest_transition_into_29: number,
  has_perfect_transition_into_19: boolean,
  has_perfect_transition_into_29: boolean,

  enable_receive_friend_requests: boolean,
  notify_on_friend_online: boolean,
  solo_chat_permission: string,
  match_chat_permission: string,

  keybind_emu_move_left: string,
  keybind_emu_move_right: string,
  keybind_emu_rot_left: string,
  keybind_emu_rot_right: string,
  keybind_puzzle_rot_left: string,
  keybind_puzzle_rot_right: string,
}

// list of all DBUser attributes
export const DBUserAttributes = [
  "userid",
  "username",
  "is_guest",
  "authentication",
  "created_at",
  "last_online",

  "league",
  "xp",
  "trophies",
  "highest_trophies",

  "puzzle_elo",
  "highest_puzzle_elo",
  "puzzles_attempted",
  "puzzles_solved",
  "puzzle_seconds_played",

  "highest_score",
  "highest_level",
  "highest_lines",

  "highest_transition_into_19",
  "highest_transition_into_29",
  "has_perfect_transition_into_19",
  "has_perfect_transition_into_29",

  "enable_receive_friend_requests",
  "notify_on_friend_online",
  "solo_chat_permission",
  "match_chat_permission",

  "keybind_emu_move_left",
  "keybind_emu_move_right",
  "keybind_emu_rot_left",
  "keybind_emu_rot_right",
  "keybind_puzzle_rot_left",
  "keybind_puzzle_rot_right",
];


