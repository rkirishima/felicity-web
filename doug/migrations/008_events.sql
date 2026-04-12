-- Event date voting system (調整さん風)
-- Allows staff to create events with candidate dates,
-- visitors vote ○/△/× on dates, event confirmed when threshold met.

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_en text NOT NULL,
  description text,
  description_en text,
  photo text,
  min_votes int DEFAULT 3,
  status text DEFAULT 'open',       -- open | confirmed | closed | cancelled
  confirmed_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,
  end_time time,
  yes_count int DEFAULT 0,
  maybe_count int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS event_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date_id uuid REFERENCES event_dates(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  voter_name text NOT NULL,
  voter_email text NOT NULL,
  response text NOT NULL,           -- yes | maybe | no
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_date_id, voter_email)
);

CREATE INDEX IF NOT EXISTS idx_event_dates_event ON event_dates(event_id);
CREATE INDEX IF NOT EXISTS idx_event_votes_date ON event_votes(event_date_id);
CREATE INDEX IF NOT EXISTS idx_event_votes_email ON event_votes(voter_email, event_id);
