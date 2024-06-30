import { SendPushNotificationMessage, UpdateFriendsMessage } from "../../network-protocol/json-message";
import { Challenge } from "../../network-protocol/models/challenge";
import { OnlineUser, UserEvent } from "./online-user";
import { ServerState } from "./server-state";
import { NotificationType } from "../../network-protocol/models/notifications";

/*
Manages all the ongoing challenges between players. Challenges are undirected edges between players.
*/
export class ChallengeManager {

  private challenges: Map<string, Challenge> = new Map();

  constructor(private readonly state: ServerState) {}

  private challengeToKey(player1: string, player2: string): string {
    const players = [player1, player2].sort();
    return players.join(",");
  }

  // create a challenge from sender to receiver
  // Only one challenge can exist between two players at a time
  createChallenge(challenge: Challenge): { success: boolean, error?: string } {

    const sender = this.state.onlineUserManager.getOnlineUserByUsername(challenge.sender);
    const receiver = this.state.onlineUserManager.getOnlineUserByUsername(challenge.receiver);
    
    // if either player is offline, challenge cannot be created. return false
    if (!receiver) return {
      success: false,
      error: "Player went offline! Challenge cannot be created"
    };

    // theoretically, this should never happen as the sender should always be online
    if (!sender) return {
      success: false,
      error: "Internal error occurred. Please try again later"
    };

    // set the challenge, and overwrite any existing challenge
    const key = this.challengeToKey(challenge.sender, challenge.receiver);
    this.challenges.set(key, challenge);
    console.log(`Challenge sent from ${challenge.sender} to ${challenge.receiver}`);

    // send notification to receiver
    const text = `${challenge.sender} challenged you to a ${challenge.rated ? 'rated' : 'friendly'} game!`;
    receiver?.sendJsonMessage(new SendPushNotificationMessage(NotificationType.SUCCESS, text));
    receiver?.sendJsonMessage(new UpdateFriendsMessage());

    // if either player goes offline, remove the challenge
    [sender, receiver].forEach((player) => player!.subscribe(UserEvent.ON_USER_OFFLINE, () => {
      console.log(`Challenge from ${challenge.sender} to ${challenge.receiver} cancelled due to user offline`);
      this.challenges.delete(key);
    }));

    return { success: true };
  }

  // get the challenge between two players
  getChallenge(player1: string, player2: string): Challenge | undefined {
    const key = this.challengeToKey(player1, player2);
    return this.challenges.get(key);
  }
}