import * as express from 'express';
import * as path from 'path';
import * as morgan from 'morgan'; // Import Morgan

//import * as livereload from 'livereload';
//import * as connectLivereload from 'connect-livereload';


import { Express, NextFunction, Request, Response } from 'express';
import { ServerState } from './server-state/server-state';
import { broadcastAnnouncementRoute } from './routes/broadcast-route';
import { get } from 'mongoose';
import { endFriendshipRoute, getAllUsernamesMatchingPatternRoute, getFriendsInfoRoute, getUserByUsernameRoute, setFriendRequestRoute } from './routes/user-route';
import { connectToDB } from './database';
import { getTopMovesHybridRoute } from './stackrabbit/stackrabbit';
import { addPlayerPuzzleRoute } from './player-puzzles/add-player-puzzle';
import { getPlayerPuzzlesByUserRoute } from './player-puzzles/get-puzzles-by-user';
import { getPlayerPuzzleRoute } from './player-puzzles/get-player-puzzle';
import { getFolderRoute } from './player-puzzles/get-folder';
import { deletePlayerPuzzleRoute } from './player-puzzles/delete-player-puzzle';
import { generatePuzzlesRoute, getRatedPuzzlesListRoute } from './puzzle-generation/generate-puzzles';
import { calculateEloChangeForPuzzle, getRandomPuzzleRatingForPlayerElo, selectRandomPuzzleForUserRoute } from './puzzle-generation/select-puzzle';
import { submitPuzzleAttemptRoute } from './puzzle-generation/submit-puzzle-attempt';
import { getDailyStreakRoute } from './puzzle-dashboard/puzzle-streak';
import { getRelativePuzzleRankRoute } from './puzzle-dashboard/relative-puzzle-rank';
import { setFeedbackRoute } from './puzzle-generation/set-feedback';
import { getAttemptStatsRoute } from './puzzle-generation/get-attempt-stats';
import { getOCRDigits, initOCRDigits } from './ocr/digit-reader';
import { send } from 'process';
import { sendChallengeRoute } from './routes/challenge-route';


require('dotenv').config();

export default async function createApp(): Promise<{
    app : Express,
    state : ServerState
}> {
    const app = express();
    const clientDir = path.join(__dirname, '../../public/');

    // block until connect to db
    //await connectToDB();

    // all global state is stored in ServerState
    const state = new ServerState();

    // initialize OCR digits
    await initOCRDigits();

    app.use(morgan('dev'));

    // set response to json
    app.use(express.json({limit: '50mb'}));
    app.use(express.static(clientDir));

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
    app.get('/api/*', (req, res) => {
        res.status(404).send("Invalid API route");
    });

    // Catch all routes and return the index file
    app.get('/*', (req, res) => {
      res.sendFile(path.join(clientDir, 'index.html'));
    });

    return {
        app: app,
        state: state,
    }
}