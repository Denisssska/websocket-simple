import {WebSocketServer, WebSocket} from 'ws';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = 8080;
const wss = new WebSocketServer({ port: 8081 });
const clients = new Set();

const arbitrators = [
  { id: '1', name: 'John Doe', isOnline: true },
  { id: '2', name: 'Jane Smith', isOnline: false }
];

wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'ws://localhost').searchParams.get('token');
  
  if (!token) {
    ws.close(1008, 'Token required');
    return;
  }
  
  clients.add(ws);
  console.log('Client connected');

  // Send status updates every 10 seconds
  const statusInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const arbitrator = arbitrators[Math.floor(Math.random() * arbitrators.length)];
      const status = Math.random() > 0.5 ? 'online' : 'offline';
      ws.send(`Arbitrator ${arbitrator.name}(${arbitrator.id}) is ${status}`);
    }
  }, 10000);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (e) {
      console.error('Message parsing error:', e);
    }
  });

  ws.on('close', () => {
    clearInterval(statusInterval);
    clients.delete(ws);
    console.log('Client disconnected');
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});