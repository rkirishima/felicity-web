-- Migration 005: project pinned notes
-- One row per project. Doug loads these automatically when chatting in a project thread.

CREATE TABLE IF NOT EXISTS doug_project_notes (
  project_id  text PRIMARY KEY,
  notes       text NOT NULL DEFAULT '',
  updated_at  timestamptz DEFAULT now()
);
