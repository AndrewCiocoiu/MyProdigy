-- Migration up: Add household_invites table
CREATE TABLE IF NOT EXISTS household_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    creator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_household_invites_code ON household_invites(code);
CREATE INDEX IF NOT EXISTS idx_household_invites_creator ON household_invites(creator_user_id);
