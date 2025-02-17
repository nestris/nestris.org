export enum Authentication {
  ADMIN = "admin", // full unrestricted access
  TRUSTED = "trusted",
  USER = "user",
  NONE = "none",
}

export enum LoginMethod {
  GUEST = "guest",
  DISCORD = "discord",
  PASSWORD = "password",
  BOT = "bot",
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
  login_method: LoginMethod,
  authentication: Authentication,
  created_at: Date,
  last_online: Date,
  league: number,
  xp: number,

  matches_played: number,
  wins: number,
  losses: number,
  trophies: number,
  highest_trophies: number,

  puzzle_elo: number,
  highest_puzzle_elo: number,
  puzzles_attempted: number,
  puzzles_solved: number,
  puzzle_seconds_played: number,

  games_played: number,
  highest_score: number,
  highest_level: number,
  highest_lines: number,

  highest_transition_into_19: number,
  highest_transition_into_29: number,

  enable_receive_friend_requests: boolean,
  notify_on_friend_online: boolean,
  enable_runahead: boolean,
  show_live_analysis: boolean,
  disable_midgame_quests: boolean,

  keybind_emu_move_left: string,
  keybind_emu_move_right: string,
  keybind_emu_rot_left: string,
  keybind_emu_rot_right: string,
  keybind_emu_up: string,
  keybind_emu_down: string,
  keybind_emu_start: string,
  keybind_emu_reset: string,
  keybind_puzzle_rot_left: string,
  keybind_puzzle_rot_right: string,

  quest_progress: number[],
}

export interface DBUserWithOnlineStatus extends DBUser {
  online: boolean;
}

// list of all DBUser attributes
export const DBUserAttributes = [
  'userid',
  'username',
  'login_method',
  'authentication',
  'created_at',
  'last_online',
  'league',
  'xp',

  'matches_played',
  'wins',
  'losses',
  'trophies',
  'highest_trophies',

  'puzzle_elo',
  'highest_puzzle_elo',
  'puzzles_attempted',
  'puzzles_solved',
  'puzzle_seconds_played',

  'games_played',
  'highest_score',
  'highest_level',
  'highest_lines',

  'highest_transition_into_19',
  'highest_transition_into_29',

  'enable_receive_friend_requests',
  'notify_on_friend_online',
  'enable_runahead',
  'show_live_analysis',
  'disable_midgame_quests',
  
  'keybind_emu_move_left',
  'keybind_emu_move_right',
  'keybind_emu_rot_left',
  'keybind_emu_rot_right',
  'keybind_emu_up',
  'keybind_emu_down',
  'keybind_emu_start',
  'keybind_emu_reset',
  'keybind_puzzle_rot_left',
  'keybind_puzzle_rot_right',

  'quest_progress',
];