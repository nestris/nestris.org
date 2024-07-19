import express from 'express';
import session from 'express-session';

export interface UserSession extends session.Session {
  userid: string;
  username: string;
  accessToken: string;
  refreshToken: string;
}

export function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  console.log("checking auth");

  if (!(req.session as UserSession).userid) {
    console.log("no username in session, redirecting to logout");
    return res.status(401).send({error: "You are not logged in!"}); // unauthorized, triggers logout
  }

  next();
};

export function handleLogout(req: express.Request, res: express.Response) {
  console.log("logging out");
  req.session.destroy((err) => {
      if (err) {
          return res.status(500).send({msg: 'Failed to logout'});
      }
      res.status(200).send({msg: 'Logged out'});
  });
};

export function getUserID(req: express.Request): string {
  return (req.session as UserSession).userid;
}

export function getUsername(req: express.Request): string {
  return (req.session as UserSession).username;
}