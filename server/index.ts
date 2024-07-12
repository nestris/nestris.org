import express from 'express';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { Pool } from 'pg';

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL setup
const pool = new Pool({
  user: 'postgres',
  host: 'postgres',
  database: 'mydatabase',
  password: 'password',
  port: 5432,
});

// HTTP server setup
const server = createServer(app);

// WebSocket server setup
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    // Handle the received message
    ws.send(`Server received: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.get('/api', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW()');
    res.send(result.rows[0]);
  } finally {
    client.release();
  }
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
