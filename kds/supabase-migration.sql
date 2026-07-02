-- Run this in your Supabase SQL editor to create the orders table
-- and enable real-time subscriptions

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  square_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Index for filtering active orders
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status) WHERE status != 'COMPLETED';
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);

-- Enable real-time for the orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable RLS (adjust policies to your needs)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow read/write from anon key (for the KDS iPad on local network)
CREATE POLICY "KDS can read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "KDS can update orders" ON orders FOR UPDATE USING (true);
