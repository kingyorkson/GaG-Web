import { Client, GatewayIntentBits } from 'discord.js';

export class DiscordBot {
  constructor() {
    this.client = null;
    this.pendingAuth = null;
    this.pendingCodes = new Map();
  }

  async initialize() {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token || token === 'your_discord_bot_token') {
      console.log('Discord bot token not configured - skipping bot initialization');
      return;
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.client.once('ready', () => {
      console.log(`Discord bot logged in as ${this.client.user.tag}`);
    });

    try {
      await this.client.login(token);
    } catch (err) {
      console.error('Failed to start Discord bot:', err.message);
    }
  }

  async exchangeCode(code) {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { success: false, error: 'Discord OAuth not configured' };
    }

    try {
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `http://localhost:3001/api/auth/discord/callback`,
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        return { success: false, error: 'Failed to get access token' };
      }

      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const discordUser = await userResponse.json();

      return {
        success: true,
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        accessToken: tokenData.access_token,
      };
    } catch (err) {
      console.error('Discord OAuth error:', err);
      return { success: false, error: 'OAuth exchange failed' };
    }
  }

  setPendingCode(code, result) {
    this.pendingCodes.set(code, result);
    this.pendingAuth = result;
  }

  getPending() {
    return this.pendingAuth;
  }

  consumePending(code) {
    const result = this.pendingCodes.get(code);
    this.pendingCodes.delete(code);
    this.pendingAuth = null;
    return result;
  }
}
