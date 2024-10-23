import { Authentication } from "../../../shared/models/db-user";
import { FriendInfo, FriendStatus, OnlineUserStatus } from "../../../shared/models/friends";
import { queryDB } from "../../database-old";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { GetRoute, UserInfo } from "../route";

/**
 * Route for getting the info for all friends and incoming/outgoing friend requests for a user
 */
export class GetFriendsInfo extends GetRoute<FriendInfo[]> {
    route = "/api/v2/friends-info";
    authentication = Authentication.USER;

    async get(userInfo: UserInfo | undefined): Promise<FriendInfo[]> {
        
        const users = EventConsumerManager.getInstance().getUsers();
        const friendsInfo = await this.queryFriendsAndFriendRequestsForUser(userInfo!.userid);
        
        // temporary: later, determine if user is busy
        const onlineStatus = users.isUserOnline(userInfo!.userid) ? OnlineUserStatus.IDLE : OnlineUserStatus.OFFLINE;

        return friendsInfo.map((friend) => ({
            userid: friend.userid,
            username: friend.username,
            friendStatus: friend.type,
            onlineStatus: onlineStatus,
            xp: friend.xp,
            trophies: friend.trophies,
            puzzleElo: friend.puzzle_elo,
            challenge: undefined // TEMPORARY
        }));
    }

    private async queryFriendsAndFriendRequestsForUser(userid: string): Promise<{
        userid: string;
        username: string;
        trophies: number;
        xp: number;
        puzzle_elo: number;
        type: FriendStatus;
      }[]> {
      
        // subquery that gets the friends, pending friends, and incoming friend requests from user1
        // if type is "friends", then set to "friends"
        // if type is "1_send_to_2", then set to "outgoing", if type is "2_send_to_1", then set to "incoming"
        const subquery = `
          SELECT userid2 as userid, 
          CASE
            WHEN type = '1_send_to_2' THEN 'outgoing'
            WHEN type = '2_send_to_1' THEN 'incoming'
            ELSE type
          END as type
          FROM user_relationships
          WHERE userid1 = $1
        `;
      
        // subquery that gets the friends, pending friends, and incoming friend requests from user2
        // if type is "friends", then set to "friends"
        // if type is "1_send_to_2", then set to "incoming", if type is "2_send_to_1", then set to "outgoing"
        const subquery2 = `
          SELECT userid1 as userid, 
          CASE
            WHEN type = '1_send_to_2' THEN 'incoming'
            WHEN type = '2_send_to_1' THEN 'outgoing'
            ELSE type
          END as type
          FROM user_relationships
          WHERE userid2 = $1
        `;
      
        // make a SQL query that gets the username, trophies, xp, and type of relationship for each friend
        const query = `
          SELECT users.userid, users.username, users.trophies, users.xp, users.puzzle_elo, subquery.type
          FROM users
          JOIN (${subquery} UNION ${subquery2}) as subquery
          ON users.userid = subquery.userid
        `;
      
        const result = await queryDB(query, [userid]);
        return result.rows;
      }
}