// Server is no longer required!
// The game now uses Supabase directly for:
// - Authentication (Guest via email/password + Discord via OAuth)
// - Database (profiles, servers, friends, gardens)
// - Real-time multiplayer (Supabase Realtime channels)
//
// This file is kept as a placeholder for optional static file serving.
// For full functionality, just host the web build on GitHub Pages or any static host.
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../../web/dist')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (serving static files only)`);
  console.log('Auth and multiplayer are handled by Supabase directly.');
});
