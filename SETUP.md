# Growing & Gardening 2D - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
# Client (game)
cd client
npm install

# Server (backend)
cd ../server
npm install

# Windows (Electron)
cd ../windows
npm install

# iOS (Capacitor)
cd ../ios
npm install
```

### 2. Configure Environment
Copy `server/.env.example` to `server/.env` and fill in your credentials:
- Supabase URL and keys (from supabase.com)
- Discord bot credentials (from discord.com/developers)
- A JWT secret for auth tokens

### 3. Setup Supabase Database
- Go to your Supabase project dashboard
- Open the SQL editor
- Run the contents of `server/src/schema.sql`

### 4. Run the Server
```bash
cd server
npm run dev
```

### 5. Run the Game Client
```bash
cd client
npm run dev
```
Open http://localhost:3000 in your browser.

## Platform Builds

### Web (GitHub Pages)
```bash
cd client
npm run build
```
The built files will be in `web/dist/`. Push to GitHub and use the Actions workflow to deploy to Pages.

### Windows (Electron)
```bash
cd client
npm run build
cd ../windows
npm start    # Run in dev mode
npm run build  # Create installer
```

### iOS (Capacitor)
First build the web client:
```bash
cd client
npm run build
cd ../ios
npx cap sync
npx cap open ios   # Open in Xcode
```

## Assets to Add
Place these files in `client/assets/`:
- **images/tablet_bg.png** - Background image for tablet/main menu
- **images/slot_bg.png** - Inventory slot background
- **video/tablet_bootup.mp4** - Boot animation video

## Controller Support
Controllers work on all platforms:
- **Windows**: Xbox/PlayStation controllers via Electron
- **Web**: Gamepad API (Chrome, Edge, Firefox)
- **iOS**: MFi controllers via Safari

Key mappings:
- `X / Square` - Open Tablet
- `B / Circle` - Back / Close
- `A / Cross` - Confirm / Select
- `START` - Pause menu
