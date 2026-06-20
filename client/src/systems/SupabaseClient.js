import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cqohfidpjiudduoqcppv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6y_g2CP3d7FTesjvTGIqXg_gy2NH6yW';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
