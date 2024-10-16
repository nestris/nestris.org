import { Request, Response } from 'express';
import { Challenge } from '../../shared/models/challenge';
import { ServerState } from '../old/server-state';

// POST request with challenge parameter of type Challenge
export async function sendChallengeRoute(req: Request, res: Response, state: ServerState) {

  const challenge: Challenge = req.body.challenge;
  if (!challenge) {
    res.status(400).send("Missing 'challenge' parameter");
    return;
  }

  try {
    const result = state.challengeManager.createChallenge(challenge);
    res.status(200).send(result);
  }
  catch (error) {
    res.status(400).send(error);
  }
}

// POST request to reject challenge
export async function rejectChallengeRoute(req: Request, res: Response, state: ServerState) {

  const challenge: Challenge = req.body.challenge;
  const userid: string = req.body.userid;
  
  if (!challenge) {
    res.status(400).send("Missing 'challenge' parameter");
    return;
  }
  if (!userid) {
    res.status(400).send("Missing 'userid' parameter");
    return;
  }

  try {
    const result = state.challengeManager.rejectChallenge(challenge, userid);
    res.status(200).send({success: result});
  }
  catch (error) {
    res.status(400).send(error);
  }
}

// POST request to accept challenge
export async function acceptChallengeRoute(req: Request, res: Response, state: ServerState) {

  const challenge: Challenge = req.body.challenge;
  const sessionID: string = req.body.sessionID;
  
  if (!challenge) {
    res.status(400).send("Missing 'challenge' parameter");
    return;
  }
  if (!sessionID) {
    res.status(400).send("Missing 'sessionID' parameter");
    return;
  }

  try {
    const result = await state.challengeManager.acceptChallenge(challenge, sessionID);
    res.status(200).send({success: result});
  }
  catch (error) {
    res.status(400).send(error);
  }
}