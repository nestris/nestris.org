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
import { cTest } from './puzzles/stackrabbit';


require('dotenv').config();

export default async function createApp(): Promise<{
    app : Express,
    state : ServerState
}> {
    const app = express();
    const clientDir = path.join(__dirname, '../../public/');

    // block until connect to db
    await connectToDB();

    // all global state is stored in ServerState
    const state = new ServerState();

    app.use(morgan('dev'));

    // set response to json
    app.use(express.json({limit: '50mb'}));
    app.use(express.static(clientDir));

    app.get('/api/v2/online-users', (req, res) => {
        res.status(200).send(state.onlineUserManager.getOnlineUsersJSON());
    });

    app.get('/api/v2/num-online-friends/:username', async (req, res) => {
        const numOnlineFriends = await state.onlineUserManager.numOnlineFriends(req.params['username']);
        res.status(200).send({count: numOnlineFriends});
    });

    app.get('/api/v2/all-usernames', getAllUsernamesMatchingPatternRoute);
    app.get('/api/v2/user/:username', getUserByUsernameRoute);
    app.get('/api/v2/friends/:username',  async (req: Request, res: Response) => getFriendsInfoRoute(req, res, state));

    app.post('/api/v2/friend-request/:from/:to', setFriendRequestRoute);
    app.post('/api/v2/end-friendship/:from/:to', endFriendshipRoute);

    // announce message to all online users. useful for maintenance announcements and the like
    app.post('/api/v2/broadcast-announcement', async (req: Request, res: Response) => broadcastAnnouncementRoute(req, res, state));
    
    app.get('/api/v2/puzzle', (req, res) => { res.status(200).send(cTest()); });

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