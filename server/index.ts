import express from 'express';
import { Request, Response } from 'express';
import session from 'express-session';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import morgan from 'morgan';
import { ServerState } from './src/server-state/server-state';
import { getOCRDigits, initOCRDigits } from './src/ocr/digit-reader';
import { endFriendshipRoute, getAllUsersMatchingUsernamePatternRoute, getFriendsInfoRoute, getUserByUserIDRoute, setFriendRequestRoute } from './src/routes/user-route';
import { broadcastAnnouncementRoute } from './src/routes/broadcast-route';
import { getDailyStreakRoute } from './src/puzzle-dashboard/puzzle-streak';
import { getRelativePuzzleRankRoute } from './src/puzzle-dashboard/relative-puzzle-rank';
import { generatePuzzlesRoute } from './src/puzzle-generation/generate-puzzles';
import { getAttemptStatsRoute } from './src/puzzle-generation/get-attempt-stats';
import { getRandomPuzzleRatingForPlayerElo, selectRandomPuzzleForUserRoute, calculateEloChangeForPuzzle } from './src/puzzle-generation/select-puzzle';
import { setFeedbackRoute } from './src/puzzle-generation/set-feedback';
import { submitPuzzleAttemptRoute } from './src/puzzle-generation/submit-puzzle-attempt';
import { sendChallengeRoute, rejectChallengeRoute, acceptChallengeRoute } from './src/routes/challenge-route';
import { getTopMovesHybridRoute } from './src/stackrabbit/stackrabbit';
import axios from 'axios';
import { createUser, queryUserByUserID } from './src/database/user-queries';
import { getUserID, getUsername, handleLogout, requireAdmin, requireAuth, requireTrusted, UserSession } from './src/util/auth-util';
import { DBUser, PermissionLevel } from './shared/models/db-user';
import { getPuzzleAggregate } from './src/puzzle-generation/manage-puzzles';
import { DeploymentEnvironment, ServerStats } from './shared/models/server-stats';
import { getMultiplayerStateRoute } from './src/routes/multiplayer-routes';

// Load environment variables
require('dotenv').config();

async function main() {

  const app = express();
  const port = process.env.PORT || 3000;

  // HTTP server setup
  const server = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ server });

  // json middleware
  app.use(express.json());

  // logging middleware
  app.use(morgan('dev'))


  // all global state is stored in ServerState
  const state = new ServerState();

  // initialize OCR digits
  await initOCRDigits();

  const NODE_ENV = process.env.NODE_ENV!;
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
  const DISCORD_API_URL = 'https://discord.com/api';

  console.log(`Starting ${NODE_ENV} server`);

  app.use(session({
    secret: DISCORD_CLIENT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
  }));


  let redirectUri: string;
  const redirectToDiscord = (req: express.Request, res: express.Response) => {
    redirectUri = req.query.redirectUri as string;
    const authorizeUrl = `${DISCORD_API_URL}/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
    // send the link to the client
    console.log("redirecting to discord with url", authorizeUrl);
    res.redirect(authorizeUrl);
  };

  const handleDiscordCallback = async (req: express.Request, res: express.Response) => {
    const code = req.query.code as string;
    if (!code) {
        return res.status(400).send('Code is missing');
    }

    console.log("handling discord callback with code", code, "and redirect uri", redirectUri);

    try {
        const tokenResponse = await axios.post(`${DISCORD_API_URL}/oauth2/token`, {
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri
        }, {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        const accessToken = tokenResponse.data.access_token;
        const refreshToken = tokenResponse.data.refresh_token;

        console.log("got access token", accessToken, "and refresh token", refreshToken);

        const userResponse = await axios.get(`${DISCORD_API_URL}/users/@me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        console.log(userResponse.data);
        const userID = userResponse.data.id;

        // Check if the user is already in the database. If not, create a new user.
        let username: string;
        let permission: PermissionLevel | null;
        const user = await queryUserByUserID(userID);
        if (user) {
          // If user already exists, fetch username from database
          username = user.username;
          permission = user.permission;
        } else {
          // If user does not exist, create a new user with username from Discord global name

          username = userResponse.data.global_name;
          let discordTag = userResponse.data.username;
          permission = await createUser(userID, username, discordTag);
          if (!permission) {
            res.redirect('/not-on-whitelist');
            return
          }
        }

        // Store the user's session
        (req.session as UserSession).accessToken = accessToken;
        (req.session as UserSession).refreshToken = refreshToken;
        (req.session as UserSession).userid = userID;
        (req.session as UserSession).username = username;
        (req.session as UserSession).permission = permission;

        // Check if the user is already in the database. If not, create a new user.
        if (user) {
          // User already exists. Go to Play page
          res.redirect('/play');
          console.log(`Authenticated returning user ${username}, redirecting to play`);
        } else {
          // New User. Go to welcome page
          console.log(`Authenticated new user ${username}, redirecting to welcome`);
          res.redirect('/welcome');
        }
        
    } catch (error) {
        console.error('Error during Discord OAuth:', error);
        res.status(500).send('An error occurred during authentication');
    }
  };


  // initialize websocket
  wss.on('connection', (ws: any) => {

     // forward websocket messages to the online user manager
     ws.on('message', function incoming(message: string) {
      state.onlineUserManager.onSocketMessage(ws, message);
    });

    // forward websocket close events to the online user manager
    ws.on('close', function close(code: number, reason: string) {
      state.onlineUserManager.onSocketClose(ws, code, reason);
    });
  });

  app.get('/api/v2/login', redirectToDiscord);
  app.get('/api/v2/callback', handleDiscordCallback);
  app.post('/api/v2/logout', handleLogout);

  app.get('/api/v2/me', requireAuth, async (req, res) => {
    // send the logged in user's username, or null if not logged in
    const me: DBUser | undefined = await queryUserByUserID(getUserID(req));
    if (!me) {
      res.status(404).send({error: "User not found"});
      return;
    }
    res.send(me);
  });


  app.get('/api/v2/online-users', (req, res) => {
    res.status(200).send(state.onlineUserManager.getOnlineUsersJSON());
  });

  app.get('/api/v2/online-user/:userid', (req, res) => {
      const userid = req.params['userid'];
      res.status(200).send(state.onlineUserManager.getOnlineUserByUserID(userid)?.getOnlineUserInfo(state) ?? {error : "User not found"});
  });

  app.get('/api/v2/num-online-friends/:userid', async (req, res) => {
      const numOnlineFriends = await state.onlineUserManager.numOnlineFriends(req.params['userid']);
      res.status(200).send({count: numOnlineFriends});
  });

  app.get('/api/v2/users-by-username', getAllUsersMatchingUsernamePatternRoute);
  app.get('/api/v2/user/:userid', getUserByUserIDRoute);
  app.get('/api/v2/friends/:userid',  async (req: Request, res: Response) => getFriendsInfoRoute(req, res, state));

  app.post('/api/v2/friend-request/:from/:to', requireAuth, async (req: Request, res: Response) => setFriendRequestRoute(req, res, state)); 
  app.post('/api/v2/end-friendship/:from/:to', requireAuth, async (req: Request, res: Response) => endFriendshipRoute(req, res, state));

  // announce message to all online users. useful for maintenance announcements and the like
  app.post('/api/v2/broadcast-announcement', requireAdmin, async (req: Request, res: Response) => broadcastAnnouncementRoute(req, res, state));

  app.get('/api/v2/room/:roomID', (req, res) => {
      const roomID = req.params['roomID'];
      const room = state.roomManager.getRoomByID(roomID);
      if (!room) {
          res.status(404).send({error: "Room not found"});
          return;
      }
      res.status(200).send(room.getRoomInfo());
  });

  app.post('/api/v2/send-challenge', requireAuth, async (req: Request, res: Response) => sendChallengeRoute(req, res, state));
  app.post('/api/v2/reject-challenge', requireAuth, async (req: Request, res: Response) => rejectChallengeRoute(req, res, state));
  app.post('/api/v2/accept-challenge', requireAuth, async (req: Request, res: Response) => acceptChallengeRoute(req, res, state));

  app.get('/api/v2/stackrabbit/get-top-moves-hybrid', getTopMovesHybridRoute);

  app.post('/api/v2/generate-puzzles', requireAdmin, generatePuzzlesRoute);
  app.get('/api/v2/puzzle-aggregate', getPuzzleAggregate);

  app.get('/api/v2/random-rating', async (req: Request, res: Response) => {
      const elo = parseInt(req.query['elo'] as string);
      res.status(200).send({rating: getRandomPuzzleRatingForPlayerElo(elo)});
  });

  app.post('/api/v2/random-rated-puzzle/:userid', selectRandomPuzzleForUserRoute);

  app.get('/api/v2/elo-change', async (req: Request, res: Response) => {
      const elo = parseInt(req.query['elo'] as string);
      const attempts = parseInt(req.query['attempts'] as string);
      const rating = parseInt(req.query['rating'] as string);
      res.status(200).send({change: calculateEloChangeForPuzzle(elo, attempts, rating)});
  });

  app.post('/api/v2/submit-puzzle-attempt', requireAuth, submitPuzzleAttemptRoute);

  app.get('/api/v2/daily-streak/:userid', getDailyStreakRoute);
  app.get('/api/v2/puzzle-rank/:userid', getRelativePuzzleRankRoute);

  app.post('/api/v2/set-feedback', requireAuth, setFeedbackRoute);

  app.get('/api/v2/puzzle-attempt-stats/:userid', getAttemptStatsRoute);

  app.get('/api/v2/ocr-digits', (req: Request, res: Response) => {
      res.status(200).send(getOCRDigits());
  });

  app.get('/api/v2/lesson', (req: Request, res: Response) => {
    res.status(200).send(state.lessonState.getAllLessonHeaders());
  });

  app.get('/api/v2/lesson/:filename', (req: Request, res: Response) => {
    try {
      const lessonID = req.params['filename'];
      res.status(200).send(state.lessonState.getLessonByFilename(lessonID));
    } catch (e: any) {
      res.status(404).send({error: e.message});
    }
  });

  app.get('/api/v2/multiplayer-data/:roomID', (req: Request, res: Response) => getMultiplayerStateRoute(req, res, state))

  app.get('/api/v2/server-stats', (req: Request, res: Response) => {
    const stats: ServerStats = {
      environment: NODE_ENV as DeploymentEnvironment,
    }
    res.status(200).send(stats);
  });

  // catch all invalid api routes
  app.get('/*', (req, res) => {
      res.status(404).send("Invalid API route");
  });

  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    // sayHello();
  });
}
main();