import { Request, Response } from 'express';
import { queryAllUsersMatchingUsernamePattern, queryUserByUserID } from '../database-old/user-queries';
import { endFriendship, sendFriendRequest } from '../database-old/friendship-updates';
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