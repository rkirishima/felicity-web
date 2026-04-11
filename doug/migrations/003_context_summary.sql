-- Migration 003: add context_summary to doug_threads
-- This stores a Haiku-generated summary of the older portion of long threads,
-- so we can cap context to the last 20 messages without losing history.

ALTER TABLE doug_threads ADD COLUMN IF NOT EXISTS context_summary text;
