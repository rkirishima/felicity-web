-- Reservation + Event capacity management system
-- Adds floor capacity tracking, event scheduling fields, and reservation enhancements

-- Floor capacity config table
CREATE TABLE IF NOT EXISTS floor_capacity (
  floor text PRIMARY KEY,
  total_seats int NOT NULL,
  dog_friendly boolean DEFAULT false,
  description text
);

INSERT INTO floor_capacity (floor, total_seats, dog_friendly, description) VALUES
  ('1F', 20, true, 'メインフロア（暫定値）'),
  ('2F', 12, false, '6人テーブル + 6人ソファ')
ON CONFLICT (floor) DO NOTHING;

-- Events table extensions
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'one_off';
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_rule text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS floor_block text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS seats_blocked int DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS time_relation text DEFAULT 'during';

-- Event instances (concrete dates for calendar)
CREATE TABLE IF NOT EXISTS event_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,
  end_time time,
  status text DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_instances_date ON event_instances(date);
CREATE INDEX IF NOT EXISTS idx_event_instances_event ON event_instances(event_id);

-- Reservations table extensions
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS end_time time;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS source text DEFAULT 'chatbot';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS created_by text;
