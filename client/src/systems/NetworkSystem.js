import { supabase } from './SupabaseClient.js';

export class NetworkSystem {
  constructor() {
    this.currentServerId = null;
    this.channel = null;
    this.playerPresence = null;
    this.onPlayersUpdate = null;
    this.onInviteReceived = null;
    this.onFriendRequest = null;
  }

  async getServers() {
    const { data, error } = await supabase
      .from('servers')
      .select('*')
      .in('type', ['public', 'generated'])
      .order('created_at', { ascending: false });
    if (error) return [];
    return data.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      ownerName: s.owner_name,
      playerCount: s.player_data?.length || 0,
      maxPlayers: s.max_players,
    }));
  }

  async createServer(name, type) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not signed in' };

    const serverId = crypto.randomUUID().slice(0, 8);
    const isGenerated = !name;

    const server = {
      id: serverId,
      name: isGenerated ? `Generated Server ${Math.floor(Math.random() * 9000) + 1000}` : name,
      type: isGenerated ? 'generated' : (type || 'public'),
      owner_id: user.id,
      owner_name: user.user_metadata?.username || 'Unknown',
      player_data: [{ userId: user.id, username: user.user_metadata?.username || 'Unknown' }],
      max_players: 8,
    };

    const { error } = await supabase.from('servers').insert([server]);
    if (error) return { success: false, error: error.message };

    this.joinRealtimeChannel(server.id);
    return { success: true, server };
  }

  async joinServer(serverId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not signed in' };

    const { data: server, error } = await supabase
      .from('servers')
      .select('*')
      .eq('id', serverId)
      .single();

    if (error || !server) return { success: false, error: 'Server not found' };
    if (server.player_data.length >= server.max_players) return { success: false, error: 'Server full' };
    if (server.type === 'private' && server.owner_id !== user.id) return { success: false, error: 'Cannot join private server' };

    const playerEntry = { userId: user.id, username: user.user_metadata?.username || 'Unknown' };
    const players = [...server.player_data, playerEntry];

    const { error: updateError } = await supabase
      .from('servers')
      .update({ player_data: players })
      .eq('id', serverId);

    if (updateError) return { success: false, error: updateError.message };

    this.joinRealtimeChannel(serverId);
    return { success: true, server: { ...server, player_data: players } };
  }

  async leaveServer() {
    if (!this.currentServerId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: server } = await supabase
      .from('servers')
      .select('*')
      .eq('id', this.currentServerId)
      .single();

    if (server) {
      const players = server.player_data.filter(p => p.userId !== user.id);
      if (players.length === 0) {
        await supabase.from('servers').delete().eq('id', this.currentServerId);
      } else {
        await supabase.from('servers').update({ player_data: players }).eq('id', this.currentServerId);
      }
    }

    this.leaveRealtimeChannel();
  }

  async quickJoin() {
    const { data: servers } = await supabase
      .from('servers')
      .select('*')
      .in('type', ['public', 'generated'])
      .order('created_at', { ascending: false });

    const openServer = servers?.find(s => s.player_data.length < s.max_players);
    if (openServer) {
      return this.joinServer(openServer.id);
    }

    return this.createServer(null, 'public');
  }

  joinRealtimeChannel(serverId) {
    this.leaveRealtimeChannel();
    this.currentServerId = serverId;

    this.channel = supabase.channel(`server:${serverId}`, {
      config: { broadcast: { self: true }, presence: { key: serverId } },
    });

    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel.presenceState();
        const players = Object.values(state).flat().map(p => ({
          userId: p.userId,
          username: p.username,
        }));
        if (this.onPlayersUpdate) this.onPlayersUpdate(players);
      })
      .on('presence', { event: 'join' }, () => {})
      .on('presence', { event: 'leave' }, () => {})
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          await this.channel.track({
            userId: user?.id,
            username: user?.user_metadata?.username || 'Unknown',
            onlineAt: Date.now(),
          });
        }
      });
  }

  leaveRealtimeChannel() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.currentServerId = null;
  }

  broadcastGardenUpdate(gardenData) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'garden:update',
        payload: gardenData,
      });
    }
  }

  async sendFriendRequest(username) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not signed in' };

    const { data: targetUsers, error: searchError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .limit(1);

    if (searchError) return { success: false, error: 'Search failed' };
    if (!targetUsers || targetUsers.length === 0) return { success: false, error: 'User not found' };

    const targetUser = targetUsers[0];
    if (targetUser.id === user.id) return { success: false, error: 'Cannot add yourself' };

    const { data: existing } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${targetUser.id}),and(from_user_id.eq.${targetUser.id},to_user_id.eq.${user.id})`)
      .limit(1);

    if (existing && existing.length > 0) {
      if (existing[0].status === 'pending') return { success: false, error: 'Request already sent' };
      if (existing[0].status === 'accepted') return { success: false, error: 'Already friends' };
    }

    const { error } = await supabase.from('friend_requests').insert([{
      from_user_id: user.id,
      to_user_id: targetUser.id,
      status: 'pending',
    }]);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async acceptFriendRequest(fromUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not signed in' };

    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', user.id)
      .eq('status', 'pending');

    if (updateError) return { success: false, error: updateError.message };

    const { error: insertError } = await supabase.from('friends').insert([
      { user_id: fromUserId, friend_id: user.id },
    ]);

    if (insertError) return { success: false, error: insertError.message };
    return { success: true };
  }

  async declineFriendRequest(fromUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('friend_requests')
      .update({ status: 'declined' })
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', user.id)
      .eq('status', 'pending');
  }

  async getFriends() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('friends')
      .select('friend_id, profiles!friends_friend_id_fkey(username)')
      .eq('user_id', user.id);

    return (data || []).map(f => ({
      id: f.friend_id,
      username: f.profiles?.username,
    }));
  }

  async getPendingFriendRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('friend_requests')
      .select('from_user_id, profiles!friend_requests_from_user_id_fkey(username)')
      .eq('to_user_id', user.id)
      .eq('status', 'pending');

    return (data || []).map(r => ({
      id: r.from_user_id,
      username: r.profiles?.username,
    }));
  }

  disconnect() {
    this.leaveRealtimeChannel();
  }
}
