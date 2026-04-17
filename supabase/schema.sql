-- =============================================
-- WHITE BOX — Supabase Schema
-- "Trust-as-a-Service" Transparency Platform
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. NGOs Table
CREATE TABLE ngos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  registration  TEXT UNIQUE NOT NULL,
  sector        TEXT NOT NULL CHECK (sector IN ('health','education','disaster_relief','infrastructure','food_security')),
  admin_ratio   DECIMAL(5,2) DEFAULT 0.00,
  verified      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Donations Table
CREATE TABLE donations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name    TEXT NOT NULL DEFAULT 'Anonymous',
  donor_id      TEXT NOT NULL,
  amount        BIGINT NOT NULL CHECK (amount > 0),
  currency      TEXT DEFAULT 'PKR',
  channel       TEXT DEFAULT 'manual' CHECK (channel IN ('raast','1link','manual','bank_transfer')),
  ngo_id        UUID REFERENCES ngos(id),
  sector        TEXT NOT NULL CHECK (sector IN ('health','education','disaster_relief','infrastructure','food_security')),
  status        TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','failed')),
  tx_ref        TEXT UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. Expenses Table
CREATE TABLE expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id        UUID NOT NULL REFERENCES ngos(id),
  amount        BIGINT NOT NULL CHECK (amount > 0),
  category      TEXT NOT NULL CHECK (category IN ('direct_aid','logistics','admin','vendor_payment','salary')),
  vendor_name   TEXT,
  receipt_ref   TEXT,
  description   TEXT,
  sector        TEXT NOT NULL CHECK (sector IN ('health','education','disaster_relief','infrastructure','food_security')),
  verified      BOOLEAN DEFAULT FALSE,
  verified_by   UUID,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 4. Audit Log (Immutable Hash Chain)
CREATE TABLE audit_log (
  id            BIGSERIAL PRIMARY KEY,
  event_type    TEXT NOT NULL CHECK (event_type IN ('donation','expense','verification','adjustment')),
  ref_id        UUID NOT NULL,
  ref_table     TEXT NOT NULL CHECK (ref_table IN ('donations','expenses')),
  actor_id      TEXT NOT NULL DEFAULT 'system',
  payload_hash  TEXT NOT NULL,
  prev_hash     TEXT NOT NULL DEFAULT 'GENESIS',
  raw_payload   JSONB NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for audit chain
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_audit_log_ref ON audit_log(ref_id);

-- 5. Live Totals View (for the counter)
CREATE OR REPLACE VIEW live_totals AS
SELECT
  (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE status = 'confirmed') AS total_donated,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE verified = true) AS total_spent,
  (SELECT COUNT(*) FROM donations WHERE status = 'confirmed') AS donation_count,
  (SELECT COUNT(*) FROM expenses WHERE verified = true) AS expense_count;

-- =============================================
-- REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE donations;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see the transparency data)
CREATE POLICY "Public read ngos" ON ngos FOR SELECT USING (true);
CREATE POLICY "Public read donations" ON donations FOR SELECT USING (true);
CREATE POLICY "Public read expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Public read audit_log" ON audit_log FOR SELECT USING (true);

-- Service role write access (only API routes with service key can insert)
CREATE POLICY "Service insert ngos" ON ngos FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert donations" ON donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert expenses" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert audit_log" ON audit_log FOR INSERT WITH CHECK (true);

-- Service role update for verification
CREATE POLICY "Service update expenses" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Service update ngos" ON ngos FOR UPDATE USING (true);
