import express from 'express';
import { Request, Response } from 'express';
import session from 'express-session';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import morgan from 'morgan';
import cors from 'cors';

import { DeploymentEnvironment, ServerStats } from './shared/models/server-stats';
import { handleDiscordCallback, handleLogout, redirectToDiscord, registerAsGuest } from './src/util/discord-util';
import { OnlineUserManager } from './src/online-users/online-user-manager';
import { EventConsumerManager } from './src/online-users/event-consumer';
import { RouteManager } from './src/routes/route';
import { GetMeRoute } from './src/routes/user/get-me-route';
import { GetOnlineUsersRoute } from './src/routes/user/get-online-users-route';
import { FriendEventConsumer } from './src/online-users/event-consumers/friend-event-consumer';
import { GetFriendsInfoRoute } from './src/routes/user/get-friends-info-route';
import { PingConsumer } from './src/online-users/event-consumers/ping-consumer';
import { GetAllUsernamesRoute } from './src/routes/user/get-all-usernames-route';
import { GuestConsumer } from './src/online-users/event-consumers/guest-consumer';
import { LeaderboardManager } from './src/leaderboards/leaderboard-manager';
import { FullHighscoreLeaderboard, FullPuzzlesLeaderboard, FullTrophiesLeaderboard } from './src/leaderboards/full-leaderboard';
import { T200HighscoreLeaderboard, T200PuzzlesLeaderboard, T200RankedLeaderboard, T200XPLeaderboard } from './src/leaderboards/t200-leaderboard';
import { GetRelativeLeaderboardsRoute } from './src/routes/leaderboard/get-relative-leaderboards-route';
import { CreateSoloRoomRoute } from './src/routes/room/create-solo-room-route';
import { RoomConsumer } from './src/online-users/event-consumers/room-consumer';
import { GetCacheStatsRoute } from './src/routes/stats/get-cache-stats-route';
import { RankedQueueConsumer } from './src/online-users/event-consumers/ranked-queue-consumer';
import { EnterRankedQueueRoute } from './src/routes/room/enter-ranked-queue-route';
import { LeaveRankedQueueRoute } from './src/routes/room/leave-ranked-queue-route';
import { GetUsernamesListRoute } from './src/routes/misc/get-usernames-list-route';
import { InvitationConsumer } from './src/online-users/event-consumers/invitation-consumer';
import { FriendInvitationManager } from './src/invitations/friend-invitation';
import { GetInvitationsRoute } from './src/routes/invitations/get-invitations-route';
import { RemoveFriendRoute } from './src/routes/user/remove-friend-route';
import { MeConsumer } from './src/online-users/event-consumers/me-consumer';
import { GetT200LeaderboardRoute } from './src/routes/leaderboard/get-t200-leaderboard-route';
import { UpdateMeAttributeRoute } from './src/routes/user/update-me-attribute';
import { LeaveRoomRoute } from './src/routes/room/leave-room-route';
import { GetRoomsRoute } from './src/routes/room/get-rooms-route';
import { ExampleTask, TaskScheduler, TimeUnit } from './src/task-scheduler/task-scheduler';

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
  app.post('/api/v2/register-as-guest', registerAsGuest);
  app.post('/api/v2/logout', handleLogout);


  // Initialize singletons
  const users = new OnlineUserManager(wss);
  EventConsumerManager.bootstrap(users);

  // Register consumers
  const consumers = EventConsumerManager.getInstance();
  consumers.registerConsumer(MeConsumer);
  consumers.registerConsumer(FriendEventConsumer);
  consumers.registerConsumer(PingConsumer);
  consumers.registerConsumer(GuestConsumer);
  consumers.registerConsumer(RoomConsumer);
  consumers.registerConsumer(RankedQueueConsumer);
  consumers.registerConsumer(InvitationConsumer);

  // Initialize InvitationManagers
  const invitationConsumer = consumers.getConsumer(InvitationConsumer);
  invitationConsumer.registerInvitationManager(FriendInvitationManager);


  // Initialize leaderboards
  LeaderboardManager.registerFullLeaderboard(FullHighscoreLeaderboard);
  LeaderboardManager.registerFullLeaderboard(FullTrophiesLeaderboard);
  LeaderboardManager.registerFullLeaderboard(FullPuzzlesLeaderboard);
  LeaderboardManager.registerT200Leaderboard(T200XPLeaderboard);
  LeaderboardManager.registerT200Leaderboard(T200HighscoreLeaderboard);
  LeaderboardManager.registerT200Leaderboard(T200RankedLeaderboard);
  LeaderboardManager.registerT200Leaderboard(T200PuzzlesLeaderboard);
  await LeaderboardManager.init(users);

  // Schedule tasks
  const scheduler = new TaskScheduler();
  scheduler.schedule(ExampleTask, 5, TimeUnit.MINUTES);

  // initialize routes
  const routes = new RouteManager(app);
  routes.registerRoute(GetMeRoute);
  routes.registerRoute(GetOnlineUsersRoute);
  routes.registerRoute(GetFriendsInfoRoute);
  routes.registerRoute(GetAllUsernamesRoute);
  routes.registerRoute(GetRelativeLeaderboardsRoute);
  routes.registerRoute(GetT200LeaderboardRoute);
  routes.registerRoute(GetRoomsRoute);
  routes.registerRoute(CreateSoloRoomRoute);
  routes.registerRoute(GetCacheStatsRoute);
  routes.registerRoute(LeaveRoomRoute);
  routes.registerRoute(EnterRankedQueueRoute);
  routes.registerRoute(LeaveRankedQueueRoute);
  routes.registerRoute(GetUsernamesListRoute);
  routes.registerRoute(GetInvitationsRoute);
  routes.registerRoute(RemoveFriendRoute);
  routes.registerRoute(UpdateMeAttributeRoute);


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