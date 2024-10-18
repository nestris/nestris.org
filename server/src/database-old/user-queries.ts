import { queryDB } from ".";
import { Authentication, DBUser } from "../../shared/models/db-user";
import { FriendStatus } from "../../shared/models/friends";

function rowToUser(row: any): DBUser {
  return {
    userid: row.userid,
    username: row.username,
    authentication: row.permission,
    lastOnline: row.last_online,
    trophies: row.trophies,
    xp: row.xp,
    puzzleElo: row.puzzle_elo,
    highestPuzzleElo: row.highest_puzzle_elo
  };
}


// find a user by matching username and return the user
export async function queryUserByUserID(userid: string): Promise<DBUser | undefined> {

  // make a SQL query to get the user with the specified username
  const query = `SELECT * FROM users WHERE userid = $1`;
  const result = await queryDB(query, [userid]);

  if (result.rows.length === 0) {
    return undefined;
  }

  return rowToUser(result.rows[0]);
}

export async function usernameExists(username: string): Promise<boolean> {
  const query = `SELECT * FROM users WHERE username = $1`;
  const result = await queryDB(query, [username]);

  return result.rows.length > 0;
}


// returns a list of full friends for a user as a list of strings
export async function queryFriendUserIDsForUser(userid: string): Promise<string[]> {
  const query = `
    SELECT userid2 as userid
    FROM user_relationships
    WHERE userid1 = $1 AND type = 'friends'
    UNION
    SELECT userid1 as userid
    FROM user_relationships
    WHERE userid2 = $1 AND type = 'friends'
  `;
  const result = await queryDB(query, [userid]);
  return result.rows.map((row) => row.userid);
}

// returns a list of all usernames in the database that match the pattern, sort alphabetically
export async function queryAllUsersMatchingUsernamePattern(pattern: string = "%"): Promise<DBUser[]> {
  const query = `SELECT * FROM users WHERE username LIKE $1 ORDER BY username`;
  const result = await queryDB(query, [pattern]);

  return result.rows.map((row) => rowToUser(row));
}

// Creates a user with assigned permission if on the whitelist
// return permission if user is created, else return null
export async function createUser(userid: string, username: string): Promise<Authentication> {

  // // Get the permission level of the user
  // const query = `SELECT permission FROM whitelist WHERE discord_tag = $1`;
  // const result = await queryDB(query, [discordTag]);

  // // If the user is not on the whitelist, return false
  // if (result.rows.length === 0) {
  //   console.log(`Failed to create user ${username}, ${discordTag} not on whitelist`);
  //   return null;
  // }

  // // Create the user with the permission level
  // const permission = result.rows[0].permission as PermissionLevel;

  // If userid exists, throw error
  if (await queryUserByUserID(userid)) {
    throw new Error(`User ${username} already exists`);
  }

  // If username exists by different player, find the first available username
  if (await usernameExists(username)) {
    let i = 1;
    while (await usernameExists(`${username}${i}`)) {
      i++;
    }
    username = `${username}_${i}`;
  }

  const permission: Authentication = Authentication.USER;
  const query2 = `INSERT INTO users (userid, username, permission) VALUES ($1, $2, $3)`;
  await queryDB(query2, [userid, username, permission]);

  console.log(`Created user ${username} with permission level ${permission}`);

  return permission;
}