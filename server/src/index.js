import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { SupabaseDB } from './supabaseClient.js';
import { DiscordBot } from './discordBot.js';
import { GameServer } from './gameServer.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

let supabase;
let discordBot;
let gameServer;

try {
  supabase = new SupabaseDB();
} catch (err) {
  console.warn('Supabase not configured:', err.message);
  console.warn('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env to enable auth/database');
  supabase = null;
}

try {
  discordBot = new DiscordBot();
} catch (err) {
  console.warn('Discord bot not configured:', err.message);
  discordBot = null;
}

gameServer = new GameServer(io, supabase);

// Auth routes
app.post('/api/auth/guest/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const result = await supabase.loginGuest(username, password);
  if (result.success) {
    res.json({ user: result.user });
  } else {
    res.status(401).json({ error: result.error });
  }
});

app.post('/api/auth/guest/create', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be 8+ characters' });
  }

  const result = await supabase.createGuestAccount(username, password);
  if (result.success) {
    res.json({ user: result.user });
  } else {
    res.status(400).json({ error: result.error });
  }
});

app.get('/api/auth/check-username/:username', async (req, res) => {
  const available = await supabase.isUsernameAvailable(req.params.username);
  res.json({ available });
});

app.get('/api/auth/discord/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('No code provided');
  }

  const result = await discordBot.exchangeCode(code);
  if (result.success) {
    discordBot.setPendingCode(code, result);
    res.send('Authorization successful! You can close this window.');
  } else {
    res.status(400).send('Authorization failed.');
  }
});

app.get('/api/auth/discord/pending', (req, res) => {
  const pending = discordBot.getPending();
  res.json(pending || {});
});

app.post('/api/auth/discord/token', async (req, res) => {
  const { code } = req.body;
  const result = discordBot.consumePending(code);
  if (!result) {
    return res.status(400).json({ error: 'No pending auth found' });
  }

  if (result.existingUser) {
    res.json({ user: result.existingUser });
  } else {
    res.json({ discordUsername: result.discordUsername, discordId: result.discordId });
  }
});

app.post('/api/auth/discord/create', async (req, res) => {
  const { discordId, discordUsername, username } = req.body;
  const result = await supabase.createDiscordAccount(discordId, discordUsername, username);
  if (result.success) {
    res.json({ user: result.user });
  } else {
    res.status(400).json({ error: result.error });
  }
});

app.get('/api/servers', (req, res) => {
  const servers = gameServer.getPublicServers();
  res.json(servers);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  discordBot.initialize();
});
