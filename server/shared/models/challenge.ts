export interface Challenge {
  /*
  A challenge is a request sent by online player "sender" to online player "receiver" to play a game.
  It contains information on game mode.
  If either player goes offline, the challenge is cancelled.
  */
  senderid: number, // userid of the sender
  senderUsername: string, // username of the sender
  senderSessionID: string, // the session id of the sender
  receiverid: number, // userid of the receiver
  receiverUsername: string, // username of the receiver
  startLevel: number, // the level to start the game at
  rated: boolean, // whether the game is rated

}