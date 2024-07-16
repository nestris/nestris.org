export interface Challenge {
  /*
  A challenge is a request sent by online player "sender" to online player "receiver" to play a game.
  It contains information on game mode.
  If either player goes offline, the challenge is cancelled.
  */
  sender: string, // the pair of players that the challenge involves
  senderSessionID: string, // the session id of the sender
  receiver: string, // the pair of players that the challenge involves
  startLevel: number, // the level to start the game at
  rated: boolean, // whether the game is rated

}