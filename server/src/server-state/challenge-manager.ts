import { Challenge } from "../../shared/models/challenge";
import { NotificationType } from "../../shared/models/notifications";
import { SendPushNotificationMessage, UpdateFriendsBadgeMessage, UpdateOnlineFriendsMessage, GoToRoomMessage } from "../../shared/network/json-message";
import { UserEvent } from "./online-user";
import { ServerState } from "./server-state";

/*
Manages all the ongoing challenges between players. Challenges are undirected edges between players.
*/
export class ChallengeManager {

  private challenges: Map<string, Challenge> = new Map();

  constructor(private readonly state: ServerState) {}

  // convert two players to a unique key which is used to index this.challenges
  private challengeToKey(player1: string, player2: string): string {
    const players = [player1, player2].sort();
    return players.join(",");
  }

  // create a challenge from sender to receiver
  // Only one challenge can exist between two players at a time
  createChallenge(challenge: Challenge): { success: boolean, error?: string } {

    const sender = this.state.onlineUserManager.getOnlineUserByUserID(challenge.senderid);
    const receiver = this.state.onlineUserManager.getOnlineUserByUserID(challenge.receiverid);
    
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
    const key = this.challengeToKey(challenge.senderid, challenge.receiverid);
    this.challenges.set(key, challenge);
    console.log(`Challenge sent from ${challenge.senderUsername} to ${challenge.receiverUsername}`);

    // send notification to receiver
    const text = `${challenge.senderUsername} challenged you to a ${challenge.rated ? 'rated' : 'friendly'} game!`;
    receiver?.sendJsonMessage(new SendPushNotificationMessage(NotificationType.SUCCESS, text));
    receiver?.sendJsonMessage(new UpdateFriendsBadgeMessage()); // update friends badge
    receiver?.sendJsonMessage(new UpdateOnlineFriendsMessage()); // refresh online friends list

    // if either player goes offline, remove the challenge
    [sender, receiver].forEach((player) => player!.subscribe(UserEvent.ON_USER_OFFLINE, () => {
      console.log(`Challenge from ${challenge.senderUsername} to ${challenge.receiverUsername} cancelled due to user offline`);
      this.challenges.delete(key);
    }));

    // if the session that sent the challenge closes, remove the challenge 
    sender.subscribe(UserEvent.ON_SOCKET_CLOSE, () => {

      if (sender.containsSessionID(challenge.senderSessionID) && this.challenges.has(key)) {
        console.log(`Challenge from ${challenge.senderUsername} to ${challenge.receiverUsername} cancelled due to user offline`);
        this.challenges.delete(key);
      }
    });

    return { success: true };
  }

  // find the matching challenge and remove it from the list
  // then, notify both players to refresh their friends list
  // returns true if the challenge was successfully rejected
  rejectChallenge(challenge: Challenge, rejectorid: string): boolean {
    const key = this.challengeToKey(challenge.senderid, challenge.receiverid);

    // if the challenge does not exist, do nothing
    if (!this.challenges.has(key)) {
      console.log(`Challenge from ${challenge.senderUsername} to ${challenge.receiverUsername} does not exist`);
      return false;
    }

    // remove the challenge
    this.challenges.delete(key);
    console.log(`Challenge from ${challenge.senderUsername} to ${challenge.receiverUsername} rejected`);

    // notify both players to refresh their friends list
    this.state.onlineUserManager.getOnlineUserByUserID(challenge.senderid)?.sendJsonMessage(new UpdateOnlineFriendsMessage());
    this.state.onlineUserManager.getOnlineUserByUserID(challenge.receiverid)?.sendJsonMessage(new UpdateOnlineFriendsMessage());

    // if rejector was the reciever of the challenge, notify the other player that the challenge was rejected
    if (rejectorid === challenge.receiverid) {
      const text = `${rejectorid} declined your challenge`;
      const otherUser = this.state.onlineUserManager.getOnlineUserByUserID(
        rejectorid === challenge.senderid ? challenge.receiverid : challenge.senderid
      );
      otherUser?.sendJsonMessage(new SendPushNotificationMessage(NotificationType.ERROR, text));
    }

    return true;
  }

  async acceptChallenge(challenge: Challenge, receiverSessionID: string): Promise<boolean> {

    // verify both users are not in a room. otherwise, rescind the challenge
    const sender = this.state.onlineUserManager.getOnlineUserByUserID(challenge.senderid);
    const receiver = this.state.onlineUserManager.getOnlineUserByUserID(challenge.receiverid);
    const key = this.challengeToKey(challenge.senderid, challenge.receiverid);  

    // if either player is offline, challenge cannot be accepted. return false
    if (!sender || !receiver) {
      console.log(`Challenge from ${challenge.senderUsername} to ${challenge.receiverUsername} cancelled due to user offline`);
      this.challenges.delete(key);

      if (sender) {
        sender.sendJsonMessage(new SendPushNotificationMessage(NotificationType.ERROR, `Challenge failed, ${challenge.receiverUsername} offline`));
        sender.sendJsonMessage(new UpdateOnlineFriendsMessage());
      }
      if (receiver) {
        receiver.sendJsonMessage(new SendPushNotificationMessage(NotificationType.ERROR, `Challenge failed, ${challenge.senderUsername} offline`));
        receiver.sendJsonMessage(new UpdateOnlineFriendsMessage());
      }

      return false;
    }

    // if sender or reciver session is not online, challenge cannot be accepted. return false
    if (!sender.containsSessionID(challenge.senderSessionID) || !receiver.containsSessionID(receiverSessionID)) {
      console.log(`Challenge from ${challenge.senderUsername} to ${challenge.receiverUsername} cancelled due to user offline`);
      this.challenges.delete(key);

      sender.sendJsonMessage(new UpdateOnlineFriendsMessage());
      receiver.sendJsonMessage(new UpdateOnlineFriendsMessage());
      return false;
    }

    // if either player is in a room, challenge cannot be accepted. return false
    const senderInRoom = this.state.roomManager.containsUser(challenge.senderid);
    const receiverInRoom = this.state.roomManager.containsUser(challenge.receiverid);
    if (senderInRoom || receiverInRoom) {
      console.log(`Challenge from ${challenge.senderUsername} to ${challenge.receiverUsername} cancelled due to user in room`);
      this.challenges.delete(key);

      if (sender && !receiverInRoom) {
        sender.sendJsonMessage(new SendPushNotificationMessage(NotificationType.ERROR, `Challenge failed, ${challenge.senderUsername} is busy`));
        sender.sendJsonMessage(new UpdateOnlineFriendsMessage());
      }
      if (receiver && !senderInRoom) {
        receiver.sendJsonMessage(new SendPushNotificationMessage(NotificationType.ERROR, `Challenge failed, ${challenge.receiverUsername} is busy`));
        receiver.sendJsonMessage(new UpdateOnlineFriendsMessage());
      }
      return false;
    }

    // Both players and their sessions are online. Create a room for the two players
    const roomID = await this.state.roomManager.createMultiplayerRoom(challenge, receiverSessionID);

    // send notification to both players to go to the room
    sender.sendJsonMessage(new GoToRoomMessage(roomID));
    receiver.sendJsonMessage(new GoToRoomMessage(roomID));

    // remove the challenge
    this.challenges.delete(key);
    sender.sendJsonMessage(new UpdateOnlineFriendsMessage());
    receiver.sendJsonMessage(new UpdateOnlineFriendsMessage());

    return true;

  }

  // get the challenge between two players
  getChallenge(player1: string, player2: string): Challenge | undefined {
    const key = this.challengeToKey(player1, player2);
    return this.challenges.get(key);
  }
}