import * as express from 'express';
import * as path from 'path';
import * as morgan from 'morgan'; // Import Morgan

//import * as livereload from 'livereload';
//import * as connectLivereload from 'connect-livereload';


import { Express, Request, Response } from 'express';
import { ServerState } from './server-state/server-state';
import { broadcastAnnouncementRoute } from './routes-old/broadcast-route';
import { connectToDatabase } from './database-old/connect-to-database';
import { getAllUsernamesRoute as getAllUsernamesRouteOld, getFriendsInfoRoute as getFriendsInfoRouteOld, getUserByUsernameRoute as getUserByUsernameRouteOld } from './routes-old/user-route';
import { get } from 'mongoose';
import { getAllUsersRoute, getFriendsInfoRoute, getUserByUsernameRoute } from './routes/user-route';


require('dotenv').config();

export default async function createApp(): Promise<{
    app : Express,
    state : ServerState
}> {
    const app = express();
    const clientDir = path.join(__dirname, '../../public/');

    // block until connect to MongoDB
    await connectToDatabase();

    // all global state is stored in ServerState
    const state = new ServerState();

    app.use(morgan('dev'));

    // set response to json
    app.use(express.json({limit: '50mb'}));
    app.use(express.static(clientDir));

    app.get('/api/v2/all-usernames', getAllUsersRoute);
    app.get('/api/v2/user/:username', getUserByUsernameRoute);
    app.get('/api/v2/friends/:username', getFriendsInfoRoute);

    // announce message to all online users. useful for maintenance announcements and the like
    app.post('/api/broadcast-announcement', async (req: Request, res: Response) => broadcastAnnouncementRoute(req, res, state));
    
    // returns a list of all usernames in the database
    app.get('/api/all-usernames', getAllUsernamesRouteOld);

    // get all the info on a user by their username
    app.get('/api/user/:username', getUserByUsernameRouteOld);

    // get online, status, xp and trophy stats for all friends and potential friends (incoming/outcoming) for a user
    app.get('/api/friends/:username', async (req: Request, res: Response) => getFriendsInfoRouteOld(req, res, state));

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