import { queryDB } from ".";
import { FriendStatus } from "../../shared/models/friends";
import { NotificationType } from "../../shared/models/notifications";
import { SendPushNotificationMessage, UpdateFriendsBadgeMessage, UpdateOnlineFriendsMessage } from "../../shared/network/json-message";
import { ServerState } from "../server-state/server-state";


// Used to send a friend request from one user to another
// Can also be used to accept a friend request
export async function sendFriendRequest(fromUserID: string, toUserID: string, state: ServerState): Promise<FriendStatus> {
  
  // make a SQL query to insert the friend request into the user_relationships table
  // if toUsername already sent a friend request to fromUsername, then set type to "friends"
  // if fromUsername already has a friend request to toUsername, or they are already friends, then do nothing
  // username1 < username2 in the table

  if (fromUserID === toUserID) {
    throw new Error("Cannot send a friend request to yourself");
  }

  let userid1, userid2, relationship;
  if (fromUserID < toUserID) {
    userid1 = fromUserID;
    userid2 = toUserID;
    relationship = "1_send_to_2";
  } else {
    userid1 = toUserID;
    userid2 = fromUserID;
    relationship = "2_send_to_1";
  }

  // read the type of relationship between the two users. if does not exist, means no relationship
  const query = `
    SELECT type
    FROM user_relationships
    WHERE userid1 = $1 AND userid2 = $2
  `;

  const result = await queryDB(query, [userid1, userid2]);

  const fromUser = state.onlineUserManager.getOnlineUserByUserID(fromUserID);
  const toUser = state.onlineUserManager.getOnlineUserByUserID(toUserID);

  if (result.rows.length === 0) {
    // if no relationship, then insert the relationship
    const insertQuery = `
      INSERT INTO user_relationships (userid1, userid2, type)
      VALUES ($1, $2, $3)
    `;
    await queryDB(insertQuery, [userid1, userid2, relationship]);

    // send notification to the toUsername user
    const message = new SendPushNotificationMessage(NotificationType.SUCCESS, `${fromUser?.username} sent you a friend request!`);
    toUser?.sendJsonMessage(message);
    toUser?.sendJsonMessage(new UpdateFriendsBadgeMessage());
    toUser?.sendJsonMessage(new UpdateOnlineFriendsMessage());

    return FriendStatus.OUTGOING;

  } else if (result.rows[0].type !== relationship) {
    const updateQuery = `
      UPDATE user_relationships
      SET type = 'friends'
      WHERE username1 = $1 AND username2 = $2
    `;
    await queryDB(updateQuery, [userid1, userid2]);

    // send notification to the fromUsername user
    const message = new SendPushNotificationMessage(NotificationType.SUCCESS, `${fromUser?.userid} accepted your friend request!`);
    toUser?.sendJsonMessage(message);

    // update online count for both users, if they are online
    toUser?.sendJsonMessage(new UpdateOnlineFriendsMessage());
    fromUser?.sendJsonMessage(new UpdateOnlineFriendsMessage());

    return FriendStatus.FRIENDS;

  } else {
    return FriendStatus.OUTGOING;
  }

}

// Used to terminate a friendship, or cancel/decline a friend request
export async function endFriendship(userid1: string, userid2: string, state: ServerState): Promise<void> {

  if (userid1 === userid2) {
    throw new Error("Cannot end a friendship with yourself");
  }

  // make a SQL query to delete the relationship from the user_relationships table
  // if no relationship exists, do nothing
  const query = `
    DELETE FROM user_relationships
    WHERE (userid1 = $1 AND userid2 = $2)
    OR (userid1 = $2 AND userid2 = $1)
  `;

  await queryDB(query, [userid1, userid2]);
}