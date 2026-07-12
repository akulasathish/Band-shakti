-- =====================================================================
-- DATABASE MIGRATION FOR BAND SHAKTI WEB APP (PostgreSQL / Supabase)
-- =====================================================================

-- 1. Create 'events' table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue VARCHAR(255) NOT NULL,
  ticket_price NUMERIC(10, 2) NOT NULL,
  total_capacity INTEGER NOT NULL,
  tickets_sold INTEGER DEFAULT 0,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create 'tickets' table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  buyer_name VARCHAR(255) NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_phone VARCHAR(50),
  ticket_type VARCHAR(50) DEFAULT 'ONLINE', -- 'ONLINE' or 'OFFLINE_GUEST'
  status VARCHAR(50) DEFAULT 'PENDING',    -- 'PENDING', 'PAID', 'CANCELLED', 'ACTIVE'
  payment_id VARCHAR(255),                  -- Instamojo Payment ID
  payment_request_id VARCHAR(255),          -- Instamojo Payment Request ID
  scanned BOOLEAN DEFAULT false,
  scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create 'gallery_assets' table
CREATE TABLE IF NOT EXISTS gallery_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,                -- 'IMAGE' or 'VIDEO'
  url TEXT NOT NULL,
  description VARCHAR(255),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create 'admin_users' table for backend dashboard verification
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,                  -- Seeded plain password for review
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for speed optimization (Highly recommended for scanning performance)
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_payment_request ON tickets(payment_request_id);

-- Seed initial admin login account
INSERT INTO admin_users (email, password)
VALUES ('admin@bandshakti.com', 'shaktiadmin')
ON CONFLICT (email) DO NOTHING;

-- Seed an upcoming mock event so checkout functions immediately
INSERT INTO events (title, description, event_date, venue, ticket_price, total_capacity, tickets_sold, is_active)
VALUES (
  'Band Shakthi Live — Jam Arena Show',
  'Fusion rock performance featuring rapid violin solos and visual synths.',
  NOW() + INTERVAL '7 days',
  'The DownTown Pub, Ground Stage',
  500.00,
  400,
  0,
  true
)
ON CONFLICT DO NOTHING;
