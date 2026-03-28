-- ─────────────────────────────────────────────────────────────
--  Database Initialisation Script
-- ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (populated on first Google login)
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id     VARCHAR(255) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    display_name  VARCHAR(255),
    first_name    VARCHAR(100),
    last_name     VARCHAR(100),
    avatar_url    TEXT,
    locale        VARCHAR(10),
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    last_login    TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for login events
CREATE TABLE IF NOT EXISTS login_events (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    event_type VARCHAR(50) DEFAULT 'login',  -- login | logout
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for frequent lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id  ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_login_user_id     ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_created_at  ON login_events(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed a readonly role for monitoring dashboards
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'readonly_user') THEN
        CREATE ROLE readonly_user LOGIN PASSWORD 'ReadOnly@123';
        GRANT CONNECT ON DATABASE authapp TO readonly_user;
        GRANT USAGE ON SCHEMA public TO readonly_user;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
    END IF;
END
$$;
