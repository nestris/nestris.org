import { Request, Response } from 'express';
import { Challenge } from 'network-protocol/models/challenge';
import { ServerState } from "server/server-state/server-state";

// POST request with challenge parameter of type Challenge
export async function sendChallengeRoute(req: Request, res: Response, state: ServerState) {

  const challenge: Challenge = req.body.challenge;
  
  if (!challenge) res.status(400).send("Missing 'challenge' parameter");

  try {
    const result = state.challengeManager.createChallenge(challenge);
    res.status(200).send(result);
  }
  catch (error) {
    res.status(400).send(error);
  }

}