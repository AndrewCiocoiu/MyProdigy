-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    personal_wood INT NOT NULL DEFAULT 0,
    personal_stone INT NOT NULL DEFAULT 0,
    personal_coins INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create cities table (created before partnerships since partnerships references it)
CREATE TABLE IF NOT EXISTS cities (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    weather_code VARCHAR(50) NOT NULL,
    cost_wood INT NOT NULL DEFAULT 0,
    cost_stone INT NOT NULL DEFAULT 0,
    cost_coins INT NOT NULL DEFAULT 0,
    tier INT NOT NULL DEFAULT 1
);

-- 2. Create partnerships table
CREATE TABLE IF NOT EXISTS partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_wood INT NOT NULL DEFAULT 0,
    shared_stone INT NOT NULL DEFAULT 0,
    shared_coins INT NOT NULL DEFAULT 0,
    current_city_id INT NOT NULL REFERENCES cities(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_different_users CHECK (user1_id <> user2_id)
);

-- 3. Create porch_dropoffs table
CREATE TABLE IF NOT EXISTS porch_dropoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_id UUID NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wood_amount INT NOT NULL DEFAULT 0,
    stone_amount INT NOT NULL DEFAULT 0,
    coin_amount INT NOT NULL DEFAULT 0,
    note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COLLECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    collected_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create pets table
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_id UUID NOT NULL UNIQUE REFERENCES partnerships(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    health INT NOT NULL DEFAULT 100 CHECK (health >= 0 AND health <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'HEALTHY' CHECK (status IN ('HEALTHY', 'SICK', 'RUNAWAY')),
    last_joint_session TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create houses table
CREATE TABLE IF NOT EXISTS houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_id UUID NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
    city_id INT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    upgrade_tier INT NOT NULL DEFAULT 1 CHECK (upgrade_tier >= 1),
    UNIQUE(partnership_id, city_id)
);

-- 7. Create focus_sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_id UUID NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('SOLO', 'JOINT', 'RESCUE')),
    duration_mins INT NOT NULL CHECK (duration_mins > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('COMPLETED', 'ABORTED')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Insert initial cities
INSERT INTO cities (id, name, weather_code, cost_wood, cost_stone, cost_coins, tier) VALUES
(1, 'Hometown', 'hometown', 0, 0, 0, 1),
(2, 'Rome', 'rome', 100, 100, 500, 2),
(3, 'NYC', 'nyc', 250, 250, 1500, 3),
(4, 'Singapore', 'singapore', 500, 500, 3000, 4),
(5, 'SF', 'sf', 750, 750, 5000, 5),
(6, 'Zurich', 'zurich', 1000, 1000, 10000, 6)
ON CONFLICT (id) DO NOTHING;
