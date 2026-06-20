import { supabase } from './SupabaseClient.js';

export class CallSystem {
  constructor() {
    this.channel = null;
    this.onIncomingCall = null;
    this.onCallUpdate = null;
    this.activeCallId = null;
    this.ringAudio = null;
  }

  async startCall(fromUserId, toUserId) {
    const { data, error } = await supabase.from('calls').insert([{
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: 'ringing',
    }]).select().single();

    if (error) return null;
    this.activeCallId = data.id;
    return data;
  }

  async answerCall(callId) {
    const { error } = await supabase.from('calls')
      .update({ status: 'answered' })
      .eq('id', callId);
    if (!error) this.activeCallId = callId;
    return !error;
  }

  async declineCall(callId) {
    await supabase.from('calls')
      .update({ status: 'declined' })
      .eq('id', callId);
    this.activeCallId = null;
  }

  async hangUp(callId) {
    await supabase.from('calls')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', callId);
    this.activeCallId = null;
  }

  subscribeToCalls(userId) {
    this.unsubscribe();
    this.channel = supabase
      .channel(`calls:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'calls',
        filter: `to_user_id=eq.${userId}`,
      }, (payload) => {
        if (this.onIncomingCall) this.onIncomingCall(payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'calls',
        filter: `to_user_id=eq.${userId}`,
      }, (payload) => {
        if (this.onCallUpdate) this.onCallUpdate(payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'calls',
        filter: `from_user_id=eq.${userId}`,
      }, (payload) => {
        if (this.onCallUpdate) this.onCallUpdate(payload.new);
      })
      .subscribe();
  }

  playRingSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(480, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.3);
      }, 500);
    } catch {}
  }

  async sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
