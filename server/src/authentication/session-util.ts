import express from 'express';
import session from 'express-session';
import { Authentication } from '../../shared/models/db-user';

export interface UserSession extends session.Session {
    userid: string;
    username: string;
    permission: Authentication;
}

export function createUserSession(req: express.Request, res: express.Response, userID: string, username: string, permission: Authentication) {

    // Store the user's session
    (req.session as UserSession).userid = userID;
    (req.session as UserSession).username = username;
    (req.session as UserSession).permission = permission;
}

export function handleLogout(req: express.Request, res: express.Response) {

    if (!req.session) {
      return res.status(200).send({msg: 'Logged out'});
    }
  
    console.log("logging out");
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send({msg: 'Failed to logout'});
        }
        res.status(200).send({msg: 'Logged out'});
    });
};