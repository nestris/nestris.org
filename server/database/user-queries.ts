import { FriendStatus } from "../../network-protocol/models/friends";
import { queryDB } from ".";

// MAKE SURE THIS IS 1:1 WITH THE DATABASE TABLE
export interface DBUser {
  username: string;
  lastOnline: Date;
  trophies: number;
  xp: number;
  puzzleElo: number;
}

// MAKE SURE EACH ATTRIBUTE CORRESPONDS TO A COLUMN IN THE DATABASE
export type DBUserAttribute = "username" | "lastOnline" | "trophies" | "xp" | "puzzleElo";

// return all the users in the database, with the specified attributes
export async function queryUserTableForAllUsers(attributes: DBUserAttribute[] = []): Promise<Partial<DBUser>[]> {

  // make a SQL query to get all usernames, as well as any additional attributes
  const query = `SELECT ${attributes.length === 0 ? "*" : attributes.join(", ")} FROM users`;
  const result = await queryDB(query);

  return result.rows;
}

// find a user by matching username and return the user
export async function queryUserTableForUser(username: string): Promise<DBUser | undefined> {

  // make a SQL query to get the user with the specified username
  const query = `SELECT * FROM users WHERE username = $1`;
  const result = await queryDB(query, [username]);

  if (result.rows.length === 0) {
    return undefined;
  }

  return result.rows[0];
}

// get the list of friends, pending friends, and incoming friend requests for a user
// user-relationship table has schema (username1, username2, type = "friends" | "1_send_to_2" | "2_send_to_1")
// join to get the trophies and xp for each friend
export async function queryFriendsAndFriendRequestsForUser(username: string): Promise<{
  username: string;
  trophies: number;
  xp: number;
  type: FriendStatus;
}[]> {

  // subquery that gets the friends, pending friends, and incoming friend requests from user1
  // if type is "friends", then set to "friends"
  // if type is "1_send_to_2", then set to "outgoing", if type is "2_send_to_1", then set to "incoming"
  const subquery = `
    SELECT username2 as username, 
    CASE
      WHEN type = '1_send_to_2' THEN 'outgoing'
      WHEN type = '2_send_to_1' THEN 'incoming'
      ELSE type
    END as type
    FROM user_relationships
    WHERE username1 = $1
  `;

  // subquery that gets the friends, pending friends, and incoming friend requests from user2
  // if type is "friends", then set to "friends"
  // if type is "1_send_to_2", then set to "incoming", if type is "2_send_to_1", then set to "outgoing"
  const subquery2 = `
    SELECT username1 as username, 
    CASE
      WHEN type = '1_send_to_2' THEN 'incoming'
      WHEN type = '2_send_to_1' THEN 'outgoing'
      ELSE type
    END as type
    FROM user_relationships
    WHERE username2 = $1
  `;

  // make a SQL query that gets the username, trophies, xp, and type of relationship for each friend
  const query = `
    SELECT users.username, users.trophies, users.xp, subquery.type
    FROM users
    JOIN (${subquery} UNION ${subquery2}) as subquery
    ON users.username = subquery.username
  `;

  const result = await queryDB(query, [username]);
  return result.rows;
}

// returns a list of full friends for a user as a list of strings
export async function queryFriendUsernamesForUser(username: string): Promise<string[]> {
  const query = `
    SELECT username2 as username
    FROM user_relationships
    WHERE username1 = $1 AND type = 'friends'
    UNION
    SELECT username1 as username
    FROM user_relationships
    WHERE username2 = $1 AND type = 'friends'
  `;
  const result = await queryDB(query, [username]);
  return result.rows;
}

// returns a list of all usernames in the database that match the pattern, sort alphabetically
export async function queryAllUsernamesMatchingPattern(pattern: string = "%"): Promise<string[]> {
  const query = `SELECT username FROM users WHERE username LIKE $1 ORDER BY username`;
  const result = await queryDB(query, [pattern]);
  return result.rows.map((row) => row.username);
}

export async function createUser(username: string): Promise<void> {
  const query = `INSERT INTO users (username) VALUES ($1)`;
  await queryDB(query, [username]);
}