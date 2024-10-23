import express from 'express';
import { Request, Response } from 'express';
import session from 'express-session';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import morgan from 'morgan';
import cors from 'cors';
// import { endFriendshipRoute, getAllUsersMatchingUsernamePatternRoute, getFriendsInfoRoute, getUserByUserIDRoute, setFriendRequestRoute } from './src/routes/user-route';
// import { broadcastAnnouncementRoute } from './src/routes/broadcast-route';
// import { getDailyStreakRoute } from './src/puzzle-dashboard/puzzle-streak';
// import { getRelativePuzzleRankRoute } from './src/puzzle-dashboard/relative-puzzle-rank';
// import { getAttemptStatsRoute } from './src/puzzle-generation/get-attempt-stats';
// import { getRandomPuzzleRatingForPlayerElo, selectRandomPuzzleForUserRoute, calculateEloChangeForPuzzle } from './src/puzzle-generation/select-puzzle';
// import { setFeedbackRoute } from './src/puzzle-generation/set-feedback';
// import { submitPuzzleAttemptRoute } from './src/puzzle-generation/submit-puzzle-attempt';
// import { sendChallengeRoute, rejectChallengeRoute, acceptChallengeRoute } from './src/routes/challenge-route';
// import { getTopMovesHybridRoute } from './src/stackrabbit/stackrabbit';
import { DBUser } from './shared/models/db-user';
// import { getPuzzleAggregate } from './src/puzzle-generation/manage-puzzles';
import { DeploymentEnvironment, ServerStats } from './shared/models/server-stats';
// import { getMultiplayerStateRoute, selectLevelForPlayer, setMultiplayerReadiness, transitionDeadToWaiting } from './src/routes/multiplayer-routes';
// import { leaveRoomRoute } from './src/routes/room-routes';
// import { postEventRoute } from './src/routes/event-route';
// import { getPuzzleRoute } from './src/routes/get-puzzle-route';
// import { warnServerRestartRoute } from './src/routes/warn-server-restart-route';
// import { getPuzzlesSolvedRoute, getTotalPuzzleDuration, getUserCountRoute } from './src/routes/db-route';
// import { getPuzzleLeaderboard } from './src/database/leaderboard-queries';
// import { getPuzzleGuessesRoute } from './src/routes/puzzle-guesses-route';
import { handleDiscordCallback, handleLogout, redirectToDiscord } from './src/util/discord-util';
import { OnlineUserManager } from './src/online-users/online-user-manager';
import { EventConsumerManager } from './src/online-users/event-consumer';
import { Query } from 'pg';
import { RouteManager } from './src/routes/route';
import { GetMeRoute } from './src/routes/online-users/get-me-route';
import { GetOnlineUsersRoute } from './src/routes/online-users/get-online-users-route';
import { GetOnlineFriendCountRoute } from './src/routes/friends/get-online-friend-count';
import { FriendEventConsumer } from './src/online-users/event-consumers/friend-event-consumer';
import { GetFriendsInfo } from './src/routes/friends/get-friends-info';
import { PingConsumer } from './src/online-users/event-consumers/ping-consumer';

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

  // cors middleware
  app.use(cors());

  const NODE_ENV = process.env.NODE_ENV!;
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
  console.log(`Starting ${NODE_ENV} server`);

  // Initialize express session middleware
  app.use(session({
    secret: DISCORD_CLIENT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: NODE_ENV === DeploymentEnvironment.PRODUCTION,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    } // Set to true if using HTTPS
  }));

  // initialize special auth routes
  app.get('/api/v2/login', redirectToDiscord);
  app.get('/api/v2/callback', handleDiscordCallback);
  app.post('/api/v2/logout', handleLogout);


  // Initialize singletons
  const users = new OnlineUserManager(wss);
  EventConsumerManager.bootstrap(users);

  const consumers = EventConsumerManager.getInstance();
  consumers.registerConsumer(FriendEventConsumer);
  consumers.registerConsumer(PingConsumer);

  // initialize routes
  const routes = new RouteManager(app);
  routes.registerRoute(GetMeRoute);
  routes.registerRoute(GetOnlineUsersRoute);
  routes.registerRoute(GetOnlineFriendCountRoute);
  routes.registerRoute(GetFriendsInfo);

  // app.get('/api/v2/users-by-username', getAllUsersMatchingUsernamePatternRoute);
  // app.get('/api/v2/user/:userid', getUserByUserIDRoute);
  // app.get('/api/v2/friends/:userid',  async (req: Request, res: Response) => getFriendsInfoRoute(req, res, state));

  // app.post('/api/v2/friend-request/:from/:to', requireAuth, async (req: Request, res: Response) => setFriendRequestRoute(req, res, state)); 
  // app.post('/api/v2/end-friendship/:from/:to', requireAuth, async (req: Request, res: Response) => endFriendshipRoute(req, res, state));

  // // announce message to all online users. useful for maintenance announcements and the like
  // app.post('/api/v2/broadcast-announcement', requireAdmin, async (req: Request, res: Response) => broadcastAnnouncementRoute(req, res, state));

  // app.post('/api/v2/server-restart-warning/', requireAdmin, async (req: Request, res: Response) => warnServerRestartRoute(req, res, state));
  // app.get('/api/v2/server-restart-warning/', async (req: Request, res: Response) => {
  //   res.status(200).send({warning: state.serverRestartWarning});
  // });

  // app.get('/api/v2/room/:roomID', (req, res) => {
  //     const roomID = req.params['roomID'];
  //     const room = state.roomManager.getRoomByID(roomID);
  //     if (!room) {
  //         res.status(404).send({error: "Room not found"});
  //         return;
  //     }
  //     res.status(200).send(room.getRoomInfo());
  // });

  // app.post('/api/v2/send-challenge', requireAuth, async (req: Request, res: Response) => sendChallengeRoute(req, res, state));
  // app.post('/api/v2/reject-challenge', requireAuth, async (req: Request, res: Response) => rejectChallengeRoute(req, res, state));
  // app.post('/api/v2/accept-challenge', requireAuth, async (req: Request, res: Response) => acceptChallengeRoute(req, res, state));

  // app.get('/api/v2/stackrabbit/get-top-moves-hybrid', getTopMovesHybridRoute);

  // app.get('/api/v2/puzzle-aggregate', getPuzzleAggregate);

  // app.get('/api/v2/random-rating', async (req: Request, res: Response) => {
  //     const elo = parseInt(req.query['elo'] as string);
  //     res.status(200).send({rating: getRandomPuzzleRatingForPlayerElo(elo)});
  // });


  // app.get('/api/v2/puzzle/:id', getPuzzleRoute);

  // app.post('/api/v2/random-rated-puzzle', requireAuth, async (req: Request, res: Response) => selectRandomPuzzleForUserRoute(req, res, state));
  
  // app.post('/api/v2/submit-puzzle-attempt', requireAuth, async (req: Request, res: Response) => submitPuzzleAttemptRoute(req, res, state));

  // app.get('/api/v2/puzzle-guesses/:id', getPuzzleGuessesRoute);

  // app.get('/api/v2/daily-streak/:userid', getDailyStreakRoute);
  // app.get('/api/v2/puzzle-rank/:userid', getRelativePuzzleRankRoute);

  // app.post('/api/v2/set-feedback', requireAuth, requireAuth, setFeedbackRoute);

  // app.get('/api/v2/puzzle-attempt-stats/:userid', getAttemptStatsRoute);

  // app.get('/api/v2/lesson', (req: Request, res: Response) => {
  //   res.status(200).send(state.lessonState.getAllLessonHeaders());
  // });

  // app.get('/api/v2/lesson/:filename', (req: Request, res: Response) => {
  //   try {
  //     const lessonID = req.params['filename'];
  //     res.status(200).send(state.lessonState.getLessonByFilename(lessonID));
  //   } catch (e: any) {
  //     res.status(404).send({error: e.message});
  //   }
  // });

  // app.get('/api/v2/multiplayer-data/:roomID', (req: Request, res: Response) => getMultiplayerStateRoute(req, res, state))
  // app.post('/api/v2/multiplayer/set-readiness/:sessionID/:isReady', requireAuth, 
  //   (req: Request, res: Response) => setMultiplayerReadiness(req, res, state)
  // );
  // app.post('/api/v2/multiplayer/select-level/:sessionID/:level', requireAuth,
  //   (req: Request, res: Response) => selectLevelForPlayer(req, res, state)
  // );
  // app.post('/api/v2/multiplayer/transition-dead-to-waiting/:sessionID', requireAuth,
  //   (req: Request, res: Response) => transitionDeadToWaiting(req, res, state)
  // )

  // app.post('/api/v2/leave-room/:sessionID/:roomID', requireAuth, async (req: Request, res: Response) => leaveRoomRoute(req, res, state));

  // app.post('/api/v2/event', postEventRoute);

  // app.get('/api/v2/user-count', getUserCountRoute);
  // app.get('/api/v2/puzzles-solved', getPuzzlesSolvedRoute);

  // state.cache.addQuery(app, '/api/v2/puzzle-leaderboard', getPuzzleLeaderboard, 4);

  // state.cache.addQuery(app, '/api/v2/total-puzzle-duration', getTotalPuzzleDuration, 300);

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