import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export class SupabaseDB {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey ||
        supabaseUrl === 'your_supabase_url' ||
        supabaseKey === 'your_supabase_service_role_key') {
      throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async isUsernameAvailable(username) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();
    return !data;
  }

  async createGuestAccount(username, password) {
    const available = await this.isUsernameAvailable(username);
    if (!available) {
      return { success: false, error: 'Username is not available' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const { data, error } = await this.supabase
      .from('users')
      .insert([{
        id: userId,
        username,
        password: hashedPassword,
        auth_type: 'guest',
        cash: 100,
        inventory: [],
        garden_data: {},
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating guest account:', error);
      return { success: false, error: 'Failed to create account' };
    }

    return {
      success: true,
      user: {
        id: data.id,
        username: data.username,
        type: 'guest',
        cash: data.cash,
        inventory: data.inventory || [],
      },
    };
  }

  async loginGuest(username, password) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('auth_type', 'guest')
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid username or password' };
    }

    const validPassword = await bcrypt.compare(password, data.password);
    if (!validPassword) {
      return { success: false, error: 'Invalid username or password' };
    }

    return {
      success: true,
      user: {
        id: data.id,
        username: data.username,
        type: 'guest',
        cash: data.cash,
        inventory: data.inventory || [],
      },
    };
  }

  async createDiscordAccount(discordId, discordUsername, username) {
    const available = await this.isUsernameAvailable(username);
    if (!available) {
      return { success: false, error: 'Username is not available' };
    }

    const { data: existing } = await this.supabase
      .from('users')
      .select('id')
      .eq('discord_id', discordId)
      .single();

    if (existing) {
      return { success: false, error: 'Discord account already linked' };
    }

    const userId = uuidv4();
    const { data, error } = await this.supabase
      .from('users')
      .insert([{
        id: userId,
        username,
        discord_id: discordId,
        discord_username: discordUsername,
        auth_type: 'discord',
        cash: 100,
        inventory: [],
        garden_data: {},
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating discord account:', error);
      return { success: false, error: 'Failed to create account' };
    }

    return {
      success: true,
      user: {
        id: data.id,
        username: data.username,
        type: 'discord',
        discordUsername: data.discord_username,
        cash: data.cash,
        inventory: data.inventory || [],
      },
    };
  }

  async getUserByDiscordId(discordId) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('discord_id', discordId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      username: data.username,
      type: 'discord',
      discordUsername: data.discord_username,
      cash: data.cash,
      inventory: data.inventory || [],
    };
  }

  async updateUser(userId, updates) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }
    return data;
  }

  async getFriends(userId) {
    const { data, error } = await this.supabase
      .from('friends')
      .select('friend_id, users!friends_friend_id_fkey(username, auth_type)')
      .eq('user_id', userId);

    if (error) return [];
    return data.map(f => ({
      id: f.friend_id,
      username: f.users.username,
      type: f.users.auth_type,
    }));
  }

  async addFriend(userId, friendUsername) {
    const { data: friendData } = await this.supabase
      .from('users')
      .select('id')
      .eq('username', friendUsername)
      .single();

    if (!friendData) return { success: false, error: 'User not found' };

    const { error } = await this.supabase
      .from('friends')
      .insert([{ user_id: userId, friend_id: friendData.id }]);

    if (error) {
      return { success: false, error: 'Already friends or request failed' };
    }

    return { success: true };
  }
}
