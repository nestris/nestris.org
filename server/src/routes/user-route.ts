import { Request, Response } from 'express';
import { queryAllUsersMatchingUsernamePattern, queryFriendsAndFriendRequestsForUser, queryUserByUserID } from '../database/user-queries';
import { endFriendship, sendFriendRequest } from '../database/friendship-updates';
import { ServerState } from '../old/server-state';
import { FriendInfo, FriendStatusResult } from '../../shared/models/friends';

export async function getAllUsersMatchingUsernamePatternRoute(req: Request, res: Response) {

  const response = await queryAllUsersMatchingUsernamePattern();

  res.status(200).send(response);
}

// GET request api/v2/user/:username
export async function getUserByUserIDRoute(req: Request, res: Response) {
  const userid = req.params['userid'];

  const response = await queryUserByUserID(userid);

  res.status(200).send(response);
}

// sends FriendInfo[] for all friends and potential friends (incoming/outcoming) for a user
export async function getFriendsInfoRoute(req: Request, res: Response, state: ServerState) {
  const userid = req.params['userid'];

  const response = await queryFriendsAndFriendRequestsForUser(userid);

  const friends: FriendInfo[] = response.map((friend) => {
    
    return {
      userid: friend.userid,
      username: friend.username,
      friendStatus: friend.type,
      onlineStatus: state.onlineUserManager.getOnlineStatus(friend.userid),
      xp: friend.xp,
      trophies: friend.trophies,
      challenge: state.challengeManager.getChallenge(userid, friend.userid)
    }
  });

  res.status(200).send(friends);
}

// POST request api/v2/friend-request/:from/:to
export async function setFriendRequestRoute(req: Request, res: Response, state: ServerState) {
  const from = req.params['from'];
  const to = req.params['to'];

  if (!from) res.status(400).send("Missing 'from' parameter");
  if (!to) res.status(400).send("Missing 'to' parameter");

  if (from === to) {
    res.status(400).send("Cannot send friend request to yourself");
    return;
  }

  try {
    const result = await sendFriendRequest(from, to, state);
    const response: FriendStatusResult = { status: result };
    res.status(200).send(response);
  }
  catch (error) {
    res.status(500).send(error);
  }
};

// POST request api/v2/end-friendship/:from/:to
export async function endFriendshipRoute(req: Request, res: Response, state: ServerState) {
  const from = req.params['from'];
  const to = req.params['to'];

  if (!from) {
    res.status(400).send("Missing 'from' parameter");
    return;
  }
  if (!to) {
    res.status(400).send("Missing 'to' parameter");
    return;
  }

  if (from === to) {
    res.status(400).send("Cannot end friendship with yourself");
    return;
  }

  try {
    await endFriendship(from, to, state);
    const response: FriendStatusResult = { status: undefined}
    res.status(200).send(response);
  }
  catch (error) {
    res.status(500).send(error);
  }
}