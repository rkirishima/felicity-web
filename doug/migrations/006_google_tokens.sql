-- Migration 006: Google OAuth tokens
-- Stores tokens per user so Doug can access Google Calendar on their behalf.

CREATE TABLE IF NOT EXISTS doug_google_tokens (
  user_id       text PRIMARY KEY DEFAULT 'doug',
  access_token  text NOT NULL,
  refresh_token text,
  expiry_date   bigint,
  updated_at    timestamptz DEFAULT now()
);
