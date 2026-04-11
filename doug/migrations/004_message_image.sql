-- Migration 004: add image_url to doug_messages
ALTER TABLE doug_messages ADD COLUMN IF NOT EXISTS image_url text;
