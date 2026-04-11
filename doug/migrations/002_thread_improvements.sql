ALTER TABLE doug_threads
  ADD COLUMN IF NOT EXISTS project_id text,
  ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_message_preview text,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_doug_threads_project_id ON doug_threads(project_id);
CREATE INDEX IF NOT EXISTS idx_doug_threads_pinned ON doug_threads(pinned);
CREATE INDEX IF NOT EXISTS idx_doug_threads_archived ON doug_threads(archived);
