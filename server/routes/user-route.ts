import { Request, Response } from 'express';
import { queryAllUsernamesMatchingPattern, queryFriendsAndFriendRequestsForUser, queryUserTableForUser } from '../database/user-queries';
import { endFriendship, sendFriendRequest } from '../database/friendship-updates';
import { FriendInfo, OnlineUserStatus } from '../../network-protocol/models/friends';
import { ServerState } from '../server-state/server-state';

export async function getAllUsernamesMatchingPatternRoute(req: Request, res: Response) {

  const response = await queryAllUsernamesMatchingPattern();

  res.status(200).send(response);
}

// GET request api/v2/user/:username
export async function getUserByUsernameRoute(req: Request, res: Response) {
  const username = req.params['username'];

  const response = await queryUserTableForUser(username);

  res.status(200).send(response);
}

// sends FriendInfo[] for all friends and potential friends (incoming/outcoming) for a user
export async function getFriendsInfoRoute(req: Request, res: Response, state: ServerState) {
  const username = req.params['username'];

  const response = await queryFriendsAndFriendRequestsForUser(username);

  const friends: FriendInfo[] = response.map((friend) => {
    
    return {
      username: friend.username,
      friendStatus: friend.type,
      onlineStatus: state.onlineUserManager.getOnlineStatus(friend.username),
      xp: friend.xp,
      trophies: friend.trophies
    }
  });

  res.status(200).send(friends);
}

// POST request api/v2/friend-request/:from/:to
export async function setFriendRequestRoute(req: Request, res: Response) {
  const from = req.params['from'];
  const to = req.params['to'];

  if (!from) res.status(400).send("Missing 'from' parameter");
  if (!to) res.status(400).send("Missing 'to' parameter");

  if (from === to) {
    res.status(400).send("Cannot send friend request to yourself");
    return;
  }

  try {
    const result = await sendFriendRequest(from, to);
    res.status(200).send(result);
  }
  catch (error) {
    res.status(500).send(error);
  }
};

// POST request api/v2/end-friendship/:from/:to
export async function endFriendshipRoute(req: Request, res: Response) {
  const from = req.params['from'];
  const to = req.params['to'];

  if (!from) res.status(400).send("Missing 'from' parameter");
  if (!to) res.status(400).send("Missing 'to' parameter");

  if (from === to) {
    res.status(400).send("Cannot end friendship with yourself");
    return;
  }

  try {
    await endFriendship(from, to);
    res.status(200).send("success");
  }
  catch (error) {
    res.status(500).send(error);
  }
}