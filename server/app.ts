import * as express from 'express';
import * as path from 'path';
import * as morgan from 'morgan'; // Import Morgan

//import * as livereload from 'livereload';
//import * as connectLivereload from 'connect-livereload';


import { Express, Request, Response } from 'express';


require('dotenv').config();

export default async function createApp(): Promise<{
    app : Express
}> {
    const app = express();
    const clientDir = path.join(__dirname, '../public/');

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
        app
    }
}