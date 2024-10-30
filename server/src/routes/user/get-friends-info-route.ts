import { Authentication } from "../../../shared/models/db-user";
import { FriendInfo, FriendStatus } from "../../../shared/models/friends";
import { getLeagueFromIndex, League } from "../../../shared/nestris-org/league-system";
import { Database, DBQuery } from "../../database/db-query";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { GetRoute, UserInfo } from "../route";

interface DBFriend {
  userid: string;
  username: string;
  type: FriendStatus;
  league: League;
  highest_score: number;
  trophies: number;
  puzzle_elo: number;
}

class FriendsAndPendingInfoQuery extends DBQuery<DBFriend[]> {

  // subquery that gets the friends, pending friends, and incoming friend requests from user1
  // if type is "friends", then set to "friends"
  // if type is "1_send_to_2", then set to "outgoing", if type is "2_send_to_1", then set to "incoming"
  private readonly user1Query = `
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
  private readonly user2Query = `
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
  public override readonly query = `
    SELECT users.userid, users.username, subquery.type, users.league, users.highest_score, users.trophies, users.puzzle_elo 
    FROM users
    JOIN (${this.user1Query} UNION ${this.user2Query}) as subquery
    ON users.userid = subquery.userid
  `;

  public override readonly warningMs = null;

  constructor(userid: string) {
    super([userid]);
  }

  public override parseResult(resultRows: any[]): DBFriend[] {
    return resultRows.map((row) => ({
      userid: row.userid,
      username: row.username,
      type: row.type,
      league: getLeagueFromIndex(row.league),
      highest_score: row.highest_score,
      trophies: row.trophies,
      puzzle_elo: row.puzzle_elo
    }));
  }
}


/**
 * Route for getting the info for all friends and incoming/outgoing friend requests for a user
 */
export class GetFriendsInfoRoute extends GetRoute<FriendInfo[]> {
  route = "/api/v2/friends-info";
  authentication = Authentication.USER;

  override async get(userInfo: UserInfo | undefined): Promise<FriendInfo[]> {
      
    // Get all online users
    const users = EventConsumerManager.getInstance().getUsers();

    // Get friend info from the database
    const friendsInfo = await Database.query(FriendsAndPendingInfoQuery, userInfo!.userid);
    
    return friendsInfo.map((friend) => ({
        userid: friend.userid,
        username: friend.username,
        friendStatus: friend.type,
        isOnline: users.isUserOnline(friend.userid),
        league: friend.league,
        highestScore: friend.highest_score,
        trophies: friend.trophies,
        puzzleElo: friend.puzzle_elo,
    }));
  }
}