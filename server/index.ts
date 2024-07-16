import express from 'express';
import { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { Pool } from 'pg';
import { ServerState } from './src/server-state/server-state';
import { getOCRDigits, initOCRDigits } from './src/ocr/digit-reader';
import { endFriendshipRoute, getAllUsernamesMatchingPatternRoute, getFriendsInfoRoute, getUserByUsernameRoute, setFriendRequestRoute } from './src/routes/user-route';
import { broadcastAnnouncementRoute } from './src/routes/broadcast-route';
import { addPlayerPuzzleRoute } from './src/player-puzzles/add-player-puzzle';
import { deletePlayerPuzzleRoute } from './src/player-puzzles/delete-player-puzzle';
import { getFolderRoute } from './src/player-puzzles/get-folder';
import { getPlayerPuzzleRoute } from './src/player-puzzles/get-player-puzzle';
import { getPlayerPuzzlesByUserRoute } from './src/player-puzzles/get-puzzles-by-user';
import { getDailyStreakRoute } from './src/puzzle-dashboard/puzzle-streak';
import { getRelativePuzzleRankRoute } from './src/puzzle-dashboard/relative-puzzle-rank';
import { generatePuzzlesRoute, getRatedPuzzlesListRoute } from './src/puzzle-generation/generate-puzzles';
import { getAttemptStatsRoute } from './src/puzzle-generation/get-attempt-stats';
import { getRandomPuzzleRatingForPlayerElo, selectRandomPuzzleForUserRoute, calculateEloChangeForPuzzle } from './src/puzzle-generation/select-puzzle';
import { setFeedbackRoute } from './src/puzzle-generation/set-feedback';
import { submitPuzzleAttemptRoute } from './src/puzzle-generation/submit-puzzle-attempt';
import { sendChallengeRoute, rejectChallengeRoute, acceptChallengeRoute } from './src/routes/challenge-route';
import { getTopMovesHybridRoute } from './src/stackrabbit/stackrabbit';

// Load environment variables
require('dotenv').config();

async function main() {

  const app = express();
  const port = process.env.PORT || 3000;

  // PostgreSQL setup
  const pool = new Pool({
    host: 'postgres',
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
  });

  // HTTP server setup
  const server = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ server });

  // json middleware
  app.use(express.json());

  // all global state is stored in ServerState
  const state = new ServerState();

  // initialize OCR digits
  await initOCRDigits();

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

  app.get('/api/v2/online-users', (req, res) => {
    res.status(200).send(state.onlineUserManager.getOnlineUsersJSON());
  });

  app.get('/api/v2/online-user/:username', (req, res) => {
      const username = req.params['username'];
      res.status(200).send(state.onlineUserManager.getOnlineUserByUsername(username)?.getOnlineUserInfo(state) ?? {error : "User not found"});
  });

  app.get('/api/v2/num-online-friends/:username', async (req, res) => {
      const numOnlineFriends = await state.onlineUserManager.numOnlineFriends(req.params['username']);
      res.status(200).send({count: numOnlineFriends});
  });

  app.get('/api/v2/all-usernames', getAllUsernamesMatchingPatternRoute);
  app.get('/api/v2/user/:username', getUserByUsernameRoute);
  app.get('/api/v2/friends/:username',  async (req: Request, res: Response) => getFriendsInfoRoute(req, res, state));

  app.post('/api/v2/friend-request/:from/:to', async (req: Request, res: Response) => setFriendRequestRoute(req, res, state)); 
  app.post('/api/v2/end-friendship/:from/:to', async (req: Request, res: Response) => endFriendshipRoute(req, res, state));

  // announce message to all online users. useful for maintenance announcements and the like
  app.post('/api/v2/broadcast-announcement', async (req: Request, res: Response) => broadcastAnnouncementRoute(req, res, state));

  app.get('/api/v2/room/:roomID', (req, res) => {
      const roomID = req.params['roomID'];
      const room = state.roomManager.getRoomByID(roomID);
      if (!room) {
          res.status(404).send({error: "Room not found"});
          return;
      }
      res.status(200).send(room.getRoomInfo());
  });

  app.post('/api/v2/send-challenge', async (req: Request, res: Response) => sendChallengeRoute(req, res, state));
  app.post('/api/v2/reject-challenge', async (req: Request, res: Response) => rejectChallengeRoute(req, res, state));
  app.post('/api/v2/accept-challenge', async (req: Request, res: Response) => acceptChallengeRoute(req, res, state));

  app.get('/api/v2/stackrabbit/get-top-moves-hybrid', getTopMovesHybridRoute);

  app.post('/api/v2/puzzle', addPlayerPuzzleRoute);
  app.get('/api/v2/puzzle/:puzzle', getPlayerPuzzleRoute);
  app.delete('/api/v2/puzzle/:puzzle', deletePlayerPuzzleRoute);

  app.get('/api/v2/folder/:folder', getFolderRoute);

  app.get('/api/v2/puzzles-by-user/:username', getPlayerPuzzlesByUserRoute);

  app.post('/api/v2/generate-puzzles', generatePuzzlesRoute);
  app.get('/api/v2/rated-puzzles-list', getRatedPuzzlesListRoute);

  app.get('/api/v2/random-rating', async (req: Request, res: Response) => {
      const elo = parseInt(req.query['elo'] as string);
      res.status(200).send({rating: getRandomPuzzleRatingForPlayerElo(elo)});
  });

  app.post('/api/v2/random-rated-puzzle/:username', selectRandomPuzzleForUserRoute);

  app.get('/api/v2/elo-change', async (req: Request, res: Response) => {
      const elo = parseInt(req.query['elo'] as string);
      const attempts = parseInt(req.query['attempts'] as string);
      const rating = parseInt(req.query['rating'] as string);
      res.status(200).send({change: calculateEloChangeForPuzzle(elo, attempts, rating)});
  });

  app.post('/api/v2/submit-puzzle-attempt', submitPuzzleAttemptRoute);

  app.get('/api/v2/daily-streak/:username', getDailyStreakRoute);
  app.get('/api/v2/puzzle-rank/:username', getRelativePuzzleRankRoute);

  app.post('/api/v2/set-feedback', setFeedbackRoute);

  app.get('/api/v2/puzzle-attempt-stats/:username', getAttemptStatsRoute);

  app.get('/api/v2/ocr-digits', (req: Request, res: Response) => {
      res.status(200).send(getOCRDigits());
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