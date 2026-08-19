-- 業販（wholesale）— trade accounts and kilogram orders
--
-- Wholesale is deliberately separate from the retail `orders` table: pricing is
-- per-kg with a volume ladder, customers log in with their own credentials, and
-- the price sheet must never be reachable from the public shop.

-- Trade accounts. One row per customer company; `code` is what they type at the
-- login screen alongside their password.
CREATE TABLE IF NOT EXISTS wholesale_accounts (
  code text PRIMARY KEY,
  company text NOT NULL,
  contact_name text,
  email text NOT NULL,
  phone text,
  password_hash text NOT NULL,

  -- Default delivery address, prefilled on the order form (still editable).
  postal_code text,
  prefecture text,
  city text,
  street_address text,
  building text,

  -- Optional pinned pricing (税抜/kg), per grade. A grade left NULL still uses
  -- the volume ladder — used for customers quoted a fixed rate before the
  -- ladder existed, e.g. JOLT the COFFEE at ¥5,200 / ¥6,000.
  special_price_economy int,
  special_price_standard int,
  special_price_premium int,

  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE INDEX IF NOT EXISTS wholesale_accounts_active_idx ON wholesale_accounts (active);

-- Orders. Amounts are stored already broken out because a trade invoice has to
-- show 8% goods tax and 10% shipping tax separately.
CREATE TABLE IF NOT EXISTS wholesale_orders (
  id text PRIMARY KEY,
  account_code text NOT NULL REFERENCES wholesale_accounts (code),
  company text NOT NULL,
  contact_name text,
  email text NOT NULL,
  phone text,
  shipping_address text NOT NULL,

  -- [{ slug, name, grade, kg, unitPrice, amount }]
  items jsonb NOT NULL,
  total_kg int NOT NULL,
  total_green_kg numeric(6,1) NOT NULL DEFAULT 0,
  tier_label text NOT NULL,
  special_pricing boolean NOT NULL DEFAULT false,

  subtotal int NOT NULL,
  shipping int NOT NULL,
  tax_goods int NOT NULL,
  tax_shipping int NOT NULL,
  amount int NOT NULL,

  payment_method text NOT NULL,  -- 'bank_transfer' | 'card'
  status text NOT NULL,          -- 'pending_bank_transfer' | 'pending_payment' | 'paid'
  payment_intent_id text,
  square_order_id text,
  note text,

  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS wholesale_orders_account_idx ON wholesale_orders (account_code, created_at DESC);
CREATE INDEX IF NOT EXISTS wholesale_orders_status_idx ON wholesale_orders (status);

-- Service-role only: every read and write goes through the API routes, which
-- already scope queries to the logged-in account code.
ALTER TABLE wholesale_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_orders ENABLE ROW LEVEL SECURITY;
