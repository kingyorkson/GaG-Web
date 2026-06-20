import { supabase } from './SupabaseClient.js';
import { AUTH_TYPES } from '../config/constants.js';

export class AuthSystem {
  async loginGuest(username, password) {
    const email = `${username}@guest.growinggardening.game`;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { success: false, error: 'Invalid username or password' };
      return { success: true, user: this.formatUser(data.user) };
    } catch {
      return { success: false, error: 'Server unreachable' };
    }
  }

  async createGuestAccount(username, password) {
    const email = `${username}@guest.growinggardening.game`;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, auth_type: 'guest' } },
      });
      if (error) {
        if (error.message.includes('already')) {
          return { success: false, error: 'Username is not available' };
        }
        return { success: false, error: error.message };
      }
      return { success: true, user: this.formatUser(data.user) };
    } catch {
      return { success: false, error: 'Server unreachable' };
    }
  }

  async loginWithDiscord() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true, url: data.url };
  }

  async handleAuthCallback() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return { success: false, error: 'No session' };
    return { success: true, user: this.formatUser(data.session.user) };
  }

  async getDiscordUsername() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return user.user_metadata?.full_name || user.user_metadata?.user_name || user.email;
  }

  async linkDiscordAccount(username, discordUsername) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        username,
        auth_type: 'discord',
        discord_username: discordUsername,
        cash: 100,
        inventory: [],
        garden_data: {},
      });
    if (error) return { success: false, error: error.message };
    return { success: true, user: this.formatUser(user) };
  }

  formatUser(authUser) {
    if (!authUser) return null;
    return {
      id: authUser.id,
      username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'Player',
      type: authUser.user_metadata?.auth_type || AUTH_TYPES.GUEST,
      email: authUser.email,
    };
  }

  getSavedUsers() {
    const session = supabase.auth.getSession();
    const user = session ? this.formatUser(session.user) : null;
    return user ? [user] : [];
  }

  saveUser(user) {
    // Session is persisted by Supabase automatically
    localStorage.setItem('growing_gardening_active', user?.id || '');
  }

  async signOut() {
    await supabase.auth.signOut();
  }
}
