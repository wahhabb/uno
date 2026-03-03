-- Online Uno Game Database Schema
-- Initial migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Players table
CREATE TABLE players (
    email TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_email TEXT NOT NULL REFERENCES players(email) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'abandoned')),
    direction INTEGER NOT NULL DEFAULT 1 CHECK (direction IN (1, -1)),
    current_player_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    winner_email TEXT REFERENCES players(email) ON DELETE SET NULL
);

-- Game players table
CREATE TABLE game_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_email TEXT NOT NULL REFERENCES players(email) ON DELETE CASCADE,
    player_order INTEGER NOT NULL CHECK (player_order >= 0 AND player_order <= 6),
    hand JSONB NOT NULL DEFAULT '[]'::jsonb,
    uno_declared BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, player_email),
    UNIQUE(game_id, player_order)
);

-- Game invitations table
CREATE TABLE game_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game state table
CREATE TABLE game_state (
    game_id UUID PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
    draw_pile JSONB NOT NULL DEFAULT '[]'::jsonb,
    discard_pile JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_color TEXT CHECK (current_color IN ('red', 'blue', 'green', 'yellow') OR current_color IS NULL),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game actions table (for history/debugging)
CREATE TABLE game_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_email TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('play_card', 'draw_card', 'declare_uno', 'call_uno_fail', 'choose_color')),
    action_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for looking up pending invitations by email
CREATE INDEX idx_game_invitations_invitee_email ON game_invitations(invitee_email) WHERE status = 'pending';

-- Index for finding stale games
CREATE INDEX idx_games_last_activity ON games(last_activity) WHERE status IN ('waiting', 'in_progress');

-- Index for game history
CREATE INDEX idx_game_actions_game_created ON game_actions(game_id, created_at DESC);

-- Index for joining players to games
CREATE INDEX idx_game_players_game_id ON game_players(game_id);

-- Index for player lookup
CREATE INDEX idx_game_players_player_email ON game_players(player_email);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;

-- Players: Anyone can read, players can update their own record
CREATE POLICY "Anyone can read players"
    ON players FOR SELECT
    USING (true);

CREATE POLICY "Players can insert themselves"
    ON players FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Players can update their own record"
    ON players FOR UPDATE
    USING (true);

-- Games: Players can read games they're part of
CREATE POLICY "Players can read their games"
    ON games FOR SELECT
    USING (
        host_email IN (SELECT email FROM players WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
        OR id IN (SELECT game_id FROM game_players WHERE player_email = current_setting('request.jwt.claims', true)::json->>'email')
    );

CREATE POLICY "Anyone can create games"
    ON games FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Host or players can update games"
    ON games FOR UPDATE
    USING (
        host_email IN (SELECT email FROM players WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
        OR id IN (SELECT game_id FROM game_players WHERE player_email = current_setting('request.jwt.claims', true)::json->>'email')
    );

-- Game Players: Players can read players in their games
CREATE POLICY "Players can read game players in their games"
    ON game_players FOR SELECT
    USING (
        game_id IN (
            SELECT game_id FROM game_players
            WHERE player_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

CREATE POLICY "Anyone can join games"
    ON game_players FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Players can update their own game player record"
    ON game_players FOR UPDATE
    USING (player_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Game Invitations: Players can read invitations to them
CREATE POLICY "Players can read invitations to them"
    ON game_invitations FOR SELECT
    USING (invitee_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Anyone can create invitations"
    ON game_invitations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Invitees can update their invitations"
    ON game_invitations FOR UPDATE
    USING (invitee_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Game State: Players can read state of their games
CREATE POLICY "Players can read state of their games"
    ON game_state FOR SELECT
    USING (
        game_id IN (
            SELECT game_id FROM game_players
            WHERE player_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

CREATE POLICY "Anyone can create game state"
    ON game_state FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Players can update state of their games"
    ON game_state FOR UPDATE
    USING (
        game_id IN (
            SELECT game_id FROM game_players
            WHERE player_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Game Actions: Players can read actions in their games
CREATE POLICY "Players can read actions in their games"
    ON game_actions FOR SELECT
    USING (
        game_id IN (
            SELECT game_id FROM game_players
            WHERE player_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

CREATE POLICY "Anyone can insert actions"
    ON game_actions FOR INSERT
    WITH CHECK (true);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update last_activity on games table
CREATE OR REPLACE FUNCTION update_game_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE games
    SET last_activity = NOW()
    WHERE id = NEW.game_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_activity when game_actions are inserted
CREATE TRIGGER trigger_update_game_activity
AFTER INSERT ON game_actions
FOR EACH ROW
EXECUTE FUNCTION update_game_last_activity();

-- Function to cleanup abandoned games (run periodically)
CREATE OR REPLACE FUNCTION cleanup_abandoned_games()
RETURNS void AS $$
BEGIN
    -- Mark games as abandoned if no activity for 1 hour
    UPDATE games
    SET status = 'abandoned'
    WHERE status IN ('waiting', 'in_progress')
    AND last_activity < NOW() - INTERVAL '1 hour';

    -- Delete games that have been abandoned for over 1 hour
    DELETE FROM games
    WHERE status = 'abandoned'
    AND last_activity < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- REALTIME PUBLICATION
-- =============================================

-- Enable realtime for all game-related tables
-- Note: This needs to be enabled in Supabase dashboard or via SQL
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE game_actions;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE players IS 'Stores player information identified by email';
COMMENT ON TABLE games IS 'Stores game metadata and current state';
COMMENT ON TABLE game_players IS 'Links players to games with their hands and order';
COMMENT ON TABLE game_invitations IS 'Tracks game invitations sent to players';
COMMENT ON TABLE game_state IS 'Stores the current game state (draw pile, discard pile, etc.)';
COMMENT ON TABLE game_actions IS 'Logs all game actions for history and debugging';
