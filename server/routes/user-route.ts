import { Request, Response } from 'express';
import { queryFriendsForUser, queryUserTableForAllUsers, queryUserTableForUser } from '../database/user-queries';

export async function getAllUsersRoute(req: Request, res: Response) {

  const response = await queryUserTableForAllUsers(["username", "trophies", "xp"]);

  res.status(200).send(response);
}

// GET request api/v2/user/:username
export async function getUserByUsernameRoute(req: Request, res: Response) {
  const username = req.params['username'];

  const response = await queryUserTableForUser(username);

  res.status(200).send(response);
}

export async function getFriendsInfoRoute(req: Request, res: Response) {
  const username = req.params['username'];

  const response = await queryFriendsForUser(username);

  res.status(200).send(response);
}