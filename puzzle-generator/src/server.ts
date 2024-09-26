import express from 'express';
import { Request, Response } from 'express';
import { createServer } from 'http';
import morgan from 'morgan';
import cors from 'cors';
import { ratePuzzle } from './rate-puzzle';
import { BinaryTranscoder } from '../../shared/network/tetris-board-transcoding/binary-transcoder';
import { TetrominoType } from '../../shared/tetris/tetromino-type';

export async function server() {

    const app = express();
    const port = process.env.PORT || 3002;
  
    // HTTP server setup
    const server = createServer(app);
  
  
    // json middleware
    app.use(express.json());
  
    // logging middleware
    app.use(morgan('dev'))

    app.use(cors());
  
    app.get('/test', (req: Request, res: Response) => {
        res.send({
            message: 'Hello from server'
        });
    });

    app.get('/rate-puzzle/:board/:current/:next', async (req: Request, res: Response) => {

        const boardString = req.params['board'];
        const board = BinaryTranscoder.decode(boardString);
        const current = Number(req.params['current']) as TetrominoType;
        const next = Number(req.params['next']) as TetrominoType;

        const response = await ratePuzzle(board, current, next);

        res.send(response);
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