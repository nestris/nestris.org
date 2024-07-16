import { queryDB } from ".";
import { FriendStatus } from "../../shared/models/friends";
import { NotificationType } from "../../shared/models/notifications";
import { SendPushNotificationMessage, UpdateFriendsBadgeMessage, UpdateOnlineFriendsMessage } from "../../shared/network/json-message";
import { ServerState } from "../server-state/server-state";


// Used to send a friend request from one user to another
// Can also be used to accept a friend request
export async function sendFriendRequest(fromUsername: string, toUsername: string, state: ServerState): Promise<FriendStatus> {
  
  // make a SQL query to insert the friend request into the user_relationships table
  // if toUsername already sent a friend request to fromUsername, then set type to "friends"
  // if fromUsername already has a friend request to toUsername, or they are already friends, then do nothing
  // username1 < username2 in the table

  if (fromUsername === toUsername) {
    throw new Error("Cannot send a friend request to yourself");
  }

  let username1, username2, relationship;
  if (fromUsername < toUsername) {
    username1 = fromUsername;
    username2 = toUsername;
    relationship = "1_send_to_2";
  } else {
    username1 = toUsername;
    username2 = fromUsername;
    relationship = "2_send_to_1";
  }

  // read the type of relationship between the two users. if does not exist, means no relationship
  const query = `
    SELECT type
    FROM user_relationships
    WHERE username1 = $1 AND username2 = $2
  `;

  const result = await queryDB(query, [username1, username2]);

  if (result.rows.length === 0) {
    // if no relationship, then insert the relationship
    const insertQuery = `
      INSERT INTO user_relationships (username1, username2, type)
      VALUES ($1, $2, $3)
    `;
    await queryDB(insertQuery, [username1, username2, relationship]);

    // send notification to the toUsername user
    const user = state.onlineUserManager.getOnlineUserByUsername(toUsername);
    const message = new SendPushNotificationMessage(NotificationType.SUCCESS, `${fromUsername} sent you a friend request!`);
    user?.sendJsonMessage(message);
    user?.sendJsonMessage(new UpdateFriendsBadgeMessage());
    user?.sendJsonMessage(new UpdateOnlineFriendsMessage());

    return FriendStatus.OUTGOING;

  } else if (result.rows[0].type !== relationship) {
    const updateQuery = `
      UPDATE user_relationships
      SET type = 'friends'
      WHERE username1 = $1 AND username2 = $2
    `;
    await queryDB(updateQuery, [username1, username2]);

    // send notification to the fromUsername user
    const user = state.onlineUserManager.getOnlineUserByUsername(toUsername);
    const message = new SendPushNotificationMessage(NotificationType.SUCCESS, `${fromUsername} accepted your friend request!`);
    user?.sendJsonMessage(message);

    // update online count for both users, if they are online
    user?.sendJsonMessage(new UpdateOnlineFriendsMessage());
    const fromUser = state.onlineUserManager.getOnlineUserByUsername(fromUsername);
    fromUser?.sendJsonMessage(new UpdateOnlineFriendsMessage());

    return FriendStatus.FRIENDS;

  } else {
    return FriendStatus.OUTGOING;
  }

}

// Used to terminate a friendship, or cancel/decline a friend request
export async function endFriendship(username1: string, username2: string, state: ServerState): Promise<void> {

  if (username1 === username2) {
    throw new Error("Cannot end a friendship with yourself");
  }

  // make a SQL query to delete the relationship from the user_relationships table
  // if no relationship exists, do nothing
  const query = `
    DELETE FROM user_relationships
    WHERE (username1 = $1 AND username2 = $2)
    OR (username1 = $2 AND username2 = $1)
  `;

  await queryDB(query, [username1, username2]);
}