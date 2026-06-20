-- Supabase SQL schema for Growing & Gardening 2D
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (links to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  auth_type TEXT CHECK (auth_type IN ('guest', 'discord')),
  discord_username TEXT,
  cash INTEGER DEFAULT 100,
  inventory JSONB DEFAULT '[]',
  garden_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Safely create policies (check if they exist first)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can read own profile') THEN
    CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Trigger to create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, auth_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'auth_type', 'guest')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Servers table (game lobbies)
CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('public', 'private', 'generated')),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_name TEXT,
  max_players INTEGER DEFAULT 8,
  player_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'servers' AND policyname = 'Anyone can read servers') THEN
    CREATE POLICY "Anyone can read servers" ON servers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'servers' AND policyname = 'Authenticated users can create servers') THEN
    CREATE POLICY "Authenticated users can create servers" ON servers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'servers' AND policyname = 'Owners can update their servers') THEN
    CREATE POLICY "Owners can update their servers" ON servers FOR UPDATE USING (auth.uid() = owner_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'servers' AND policyname = 'Owners can delete their servers') THEN
    CREATE POLICY "Owners can delete their servers" ON servers FOR DELETE USING (auth.uid() = owner_id);
  END IF;
END $$;

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can read own friends') THEN
    CREATE POLICY "Users can read own friends" ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can add friends') THEN
    CREATE POLICY "Users can add friends" ON friends FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can remove friends') THEN
    CREATE POLICY "Users can remove friends" ON friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;
END $$;

-- Friend requests
CREATE TABLE IF NOT EXISTS friend_requests (
  id SERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friend_requests' AND policyname = 'Users can read requests sent to them') THEN
    CREATE POLICY "Users can read requests sent to them" ON friend_requests FOR SELECT USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friend_requests' AND policyname = 'Users can send requests') THEN
    CREATE POLICY "Users can send requests" ON friend_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friend_requests' AND policyname = 'Recipients can update status') THEN
    CREATE POLICY "Recipients can update status" ON friend_requests FOR UPDATE USING (auth.uid() = to_user_id);
  END IF;
END $$;

-- Gardens table
CREATE TABLE IF NOT EXISTS gardens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  server_id TEXT,
  plots JSONB DEFAULT '[]'::jsonb,
  props JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gardens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gardens' AND policyname = 'Users can read own garden') THEN
    CREATE POLICY "Users can read own garden" ON gardens FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gardens' AND policyname = 'Users can update own garden') THEN
    CREATE POLICY "Users can update own garden" ON gardens FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gardens' AND policyname = 'Users can modify own garden') THEN
    CREATE POLICY "Users can modify own garden" ON gardens FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Messages and calls for chat system
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'read_own_messages') THEN
    CREATE POLICY read_own_messages ON messages FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'send_messages') THEN
    CREATE POLICY send_messages ON messages FOR INSERT WITH CHECK (auth.uid() = from_user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS calls (
  id BIGSERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'answered', 'declined', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calls' AND policyname = 'read_own_calls') THEN
    CREATE POLICY read_own_calls ON calls FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calls' AND policyname = 'create_calls') THEN
    CREATE POLICY create_calls ON calls FOR INSERT WITH CHECK (auth.uid() = from_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calls' AND policyname = 'update_own_calls') THEN
    CREATE POLICY update_own_calls ON calls FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_calls_from ON calls(from_user_id);
CREATE INDEX IF NOT EXISTS idx_calls_to ON calls(to_user_id);

-- Enable realtime for chat, call, and multiplayer tables
ALTER PUBLICATION supabase_realtime ADD TABLE servers;
ALTER PUBLICATION supabase_realtime ADD TABLE friends;
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE calls;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_servers_type ON servers(type);

-- QR auth tokens for mobile sign-in
CREATE TABLE IF NOT EXISTS qr_auth_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
  used BOOLEAN DEFAULT FALSE
);

ALTER TABLE qr_auth_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'qr_auth_tokens' AND policyname = 'authenticated_insert') THEN
    CREATE POLICY authenticated_insert ON qr_auth_tokens FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- RPC: authenticate with QR token (no auth required - token is the key)
CREATE OR REPLACE FUNCTION authenticate_with_qr(token_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'auth_type', p.auth_type
  ) INTO result
  FROM qr_auth_tokens q
  JOIN profiles p ON p.id = q.user_id
  WHERE q.token = token_text
    AND q.used = FALSE
    AND q.expires_at > NOW();

  IF result IS NOT NULL THEN
    UPDATE qr_auth_tokens SET used = TRUE WHERE token = token_text;
  END IF;

  RETURN result;
END;
$$;
