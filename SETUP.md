# Growing & Gardening 2D - Setup Guide

## Architecture
The game uses **Supabase** for everything - no custom server needed:
- **Auth**: Guest accounts (email/password) + Discord OAuth
- **Database**: User profiles, servers, friends, gardens
- **Multiplayer**: Supabase Realtime channels

## Quick Start

### 1. Install client dependencies
```bash
cd client
npm install
```

### 2. Run the game
```bash
cd client
npm run dev
```
Open **http://localhost:3000** in your browser.

## Supabase Setup (One Time)

### 1. Enable Discord Auth
In your Supabase dashboard:
- Go to **Authentication** → **Providers**
- Click **Discord** and enable it
- Enter your Discord Client ID and Secret (from discord.com/developers)
- Set the redirect URL to: `https://cqohfidpjiudduoqcppv.supabase.co/auth/v1/callback`

### 2. Run the Database Schema
- Go to **SQL Editor** in Supabase
- Copy-paste the contents of `server/src/schema.sql`
- Click **Run**

### 3. Enable Realtime
- Go to **Database** → **Replication**
- Make sure the `servers` table is in the `supabase_realtime` publication

## Deploy to Web (GitHub Pages)

```bash
cd client
npm run build
```
The built files go to `web/dist/`. Push to GitHub and the Actions workflow auto-deploys to Pages.

## Platform Builds

### Windows (Electron)
```bash
cd client
npm run build
cd ../windows
npm start
```

### iOS (Capacitor)
```bash
cd client
npm run build
cd ../ios
npx cap sync
npx cap open ios
```

## Assets to Add
Place these in `client/assets/`:
- **images/tablet_bg.png** - Background for main menu
- **images/slot_bg.png** - Inventory slot graphic
- **video/tablet_bootup.mp4** - Boot animation video

## Controller Support
Supported on all platforms via the Gamepad API:
- `X / Square` - Open Tablet
- `B / Circle` - Back / Close
- `A / Cross` - Confirm
