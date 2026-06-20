import { supabase } from './SupabaseClient.js';

export class ChatSystem {
  constructor() {
    this.channel = null;
    this.onMessage = null;
    this.activeChatUserId = null;
  }

  async getMessages(userId1, userId2, limit = 50) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .in('from_user_id', [userId1, userId2])
      .in('to_user_id', [userId1, userId2])
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data || []).reverse();
  }

  async sendMessage(fromUserId, toUserId, content) {
    const { error } = await supabase.from('messages').insert([{
      from_user_id: fromUserId,
      to_user_id: toUserId,
      content,
    }]);
    return !error;
  }

  subscribeToMessages(userId) {
    this.unsubscribe();
    this.channel = supabase
      .channel(`chat:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `to_user_id=eq.${userId}`,
      }, (payload) => {
        if (this.onMessage) this.onMessage(payload.new);
      })
      .subscribe();
  }

  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
