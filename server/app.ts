import * as express from 'express';
import * as path from 'path';
import * as morgan from 'morgan'; // Import Morgan

//import * as livereload from 'livereload';
//import * as connectLivereload from 'connect-livereload';


import { Express, Request, Response } from 'express';
import { ServerState } from './server-state/server-state';


require('dotenv').config();

export default async function createApp(): Promise<{
    app : Express,
    state : ServerState
}> {
    const app = express();
    const clientDir = path.join(__dirname, '../public/');

    const state = new ServerState();

    app.use(morgan('dev'));

    // set response to json
    app.use(express.json({limit: '50mb'}));
    app.use(express.static(clientDir));
    
    // catch all invalid api routes
    app.get('/api/*', (req, res) => {
        res.status(404).send("Invalid API route");
    });

    // Catch all routes and return the index file
    app.get('/*', (req, res) => {
      res.sendFile(path.join(clientDir, 'index.html'));
    });

    return {
        app,
        state
    }
}