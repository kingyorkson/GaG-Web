import { AUTH_TYPES } from '../config/constants.js';

const STORAGE_KEY = 'growing_gardening_users';
const ACTIVE_KEY = 'growing_gardening_active';

export class AuthSystem {
  constructor() {
    this.serverUrl = 'http://localhost:3001';
  }

  getSavedUsers() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveUser(user) {
    const users = this.getSavedUsers();
    const existing = users.findIndex(u => u.id === user.id);
    if (existing >= 0) {
      users[existing] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(ACTIVE_KEY, user.id);
  }

  removeUser(userId) {
    const users = this.getSavedUsers().filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  async loginGuest(username, password) {
    try {
      const res = await fetch(`${this.serverUrl}/api/auth/guest/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Server unreachable' };
    }
  }

  async createGuestAccount(username, password) {
    try {
      const res = await fetch(`${this.serverUrl}/api/auth/guest/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Server unreachable' };
    }
  }

  async checkUsername(username) {
    try {
      const res = await fetch(`${this.serverUrl}/api/auth/check-username/${encodeURIComponent(username)}`);
      const data = await res.json();
      return data.available;
    } catch {
      return false;
    }
  }

  getDiscordAuthUrl() {
    const clientId = 'YOUR_DISCORD_CLIENT_ID';
    const redirectUri = `${this.serverUrl}/api/auth/discord/callback`;
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
  }

  async waitForDiscordCallback() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        try {
          const res = await fetch(`${this.serverUrl}/api/auth/discord/pending`);
          const data = await res.json();
          if (data.code) {
            clearInterval(checkInterval);

            const tokenRes = await fetch(`${this.serverUrl}/api/auth/discord/token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: data.code }),
            });
            const tokenData = await tokenRes.json();

            if (tokenData.user) {
              resolve({ success: true, user: tokenData.user });
            } else {
              resolve({ success: false, discordUsername: tokenData.discordUsername, discordId: tokenData.discordId });
            }
          }
        } catch {
          // not ready yet
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve({ success: false, error: 'Authorization timed out' });
      }, 120000);
    });
  }

  async createDiscordAccount(authData, username) {
    try {
      const res = await fetch(`${this.serverUrl}/api/auth/discord/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId: authData.discordId,
          discordUsername: authData.discordUsername,
          username,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Server unreachable' };
    }
  }
}
