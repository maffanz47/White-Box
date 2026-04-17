# 🔲 WHITE BOX — PROJECT TRUTH
> **Single Source of Truth** | Last Updated: 2026-04-18 02:20 PKT
> Micathon '26 — "Money Moves" Theme

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Name** | White Box |
| **Tagline** | "Trust-as-a-Service" — Where Every Rupee Tells the Truth |
| **Repo** | https://github.com/maffanz47/White-Box |
| **Deploy** | Vercel (TBD) |
| **Theme Alignment** | "Money Moves" — Real-time transparency for NGO donations in Pakistan |

---

## 2. Architectural Decisions

### Stack
| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | SSR + Real-time, free on Vercel |
| Charts | Recharts | Lightweight, composable, Sankey support |
| Backend/DB | Supabase (Postgres + Realtime) | Free tier, built-in Realtime subscriptions |
| Auth | Supabase Auth (Email/OTP) | Zero-cost, integrates natively |
| Integrity | SHA-256 (Web Crypto API) | Browser-native, no dependencies |
| Mock Gateway | Beeceptor + Next.js API Routes | Simulates 1Link/Raast P2M webhooks |
| Deployment | Vercel | Free tier, auto-deploy from GitHub |

### Key Design Decisions
1. **Hash Chain Strategy**: Each `audit_log` entry stores the SHA-256 of `(previous_hash + donor_id + amount + timestamp)`. This creates a tamper-evident chain — if any record is altered, all subsequent hashes break. Judges can verify this in the UI.
2. **Realtime Architecture**: Supabase Realtime subscriptions on `donations` and `expenses` tables push updates to the Live Counter without polling.
3. **Sector Enum**: Fixed set — `health`, `education`, `disaster_relief`, `infrastructure`, `food_security`. Keeps analytics clean.
4. **Currency**: All monetary values in PKR (Pakistani Rupees), stored as `BIGINT` (paisa precision, no floating point errors).
5. **No Crypto Tokens**: SHA-256 hashing is for integrity/audit only. Zero blockchain, zero tokens.

---

## 3. Database Schema (Supabase Postgres)

### Table: `ngos`
```sql
CREATE TABLE ngos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  registration  TEXT UNIQUE NOT NULL,        -- SECP/PCP registration number
  sector        TEXT NOT NULL CHECK (sector IN ('health','education','disaster_relief','infrastructure','food_security')),
  admin_ratio   DECIMAL(5,2) DEFAULT 0.00,   -- Admin cost percentage (e.g., 12.50)
  verified      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### Table: `donations`
```sql
CREATE TABLE donations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name    TEXT NOT NULL DEFAULT 'Anonymous',
  donor_id      TEXT NOT NULL,               -- Hashed phone/CNIC for privacy
  amount        BIGINT NOT NULL CHECK (amount > 0),  -- In paisa (1 PKR = 100 paisa)
  currency      TEXT DEFAULT 'PKR',
  channel       TEXT DEFAULT 'manual' CHECK (channel IN ('raast','1link','manual','bank_transfer')),
  ngo_id        UUID REFERENCES ngos(id),
  sector        TEXT NOT NULL CHECK (sector IN ('health','education','disaster_relief','infrastructure','food_security')),
  status        TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','failed')),
  tx_ref        TEXT UNIQUE,                 -- External transaction reference
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### Table: `expenses`
```sql
CREATE TABLE expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id        UUID NOT NULL REFERENCES ngos(id),
  amount        BIGINT NOT NULL CHECK (amount > 0),  -- In paisa
  category      TEXT NOT NULL CHECK (category IN ('direct_aid','logistics','admin','vendor_payment','salary')),
  vendor_name   TEXT,
  receipt_ref   TEXT,                        -- Receipt/invoice reference
  description   TEXT,
  sector        TEXT NOT NULL CHECK (sector IN ('health','education','disaster_relief','infrastructure','food_security')),
  verified      BOOLEAN DEFAULT FALSE,
  verified_by   UUID,                        -- Admin user who verified
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### Table: `audit_log` (Immutable Hash Chain)
```sql
CREATE TABLE audit_log (
  id            BIGSERIAL PRIMARY KEY,
  event_type    TEXT NOT NULL CHECK (event_type IN ('donation','expense','verification','adjustment')),
  ref_id        UUID NOT NULL,               -- FK to donations.id or expenses.id
  ref_table     TEXT NOT NULL CHECK (ref_table IN ('donations','expenses')),
  actor_id      TEXT NOT NULL DEFAULT 'system',
  payload_hash  TEXT NOT NULL,               -- SHA-256 of (prev_hash + event_data)
  prev_hash     TEXT NOT NULL DEFAULT 'GENESIS',  -- Previous record's hash (chain link)
  raw_payload   JSONB NOT NULL,              -- The actual data that was hashed
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Index for chain verification queries
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_audit_log_ref ON audit_log(ref_id);
```

### Realtime Configuration
```sql
-- Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE donations;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;
```

### Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;

-- Public read for the dashboard (anon key)
CREATE POLICY "Public read donations" ON donations FOR SELECT USING (true);
CREATE POLICY "Public read expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Public read audit_log" ON audit_log FOR SELECT USING (true);
CREATE POLICY "Public read ngos" ON ngos FOR SELECT USING (true);

-- Only service_role can insert (via API routes)
CREATE POLICY "Service insert donations" ON donations FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service insert expenses" ON expenses FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service insert audit_log" ON audit_log FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

### Aggregate View (for Live Counter)
```sql
CREATE OR REPLACE VIEW live_totals AS
SELECT
  (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE status = 'confirmed') AS total_donated,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE verified = true) AS total_spent,
  (SELECT COUNT(*) FROM donations WHERE status = 'confirmed') AS donation_count,
  (SELECT COUNT(*) FROM expenses WHERE verified = true) AS expense_count;
```

---

## 4. Hash Chain Algorithm (Pseudocode)

```
function createAuditEntry(event_type, ref_id, ref_table, data):
  // 1. Get the previous hash
  prev = SELECT payload_hash FROM audit_log ORDER BY id DESC LIMIT 1
  prev_hash = prev ?? "GENESIS"

  // 2. Build the payload to hash
  payload = {
    prev_hash,
    event_type,
    ref_id,
    ref_table,
    amount: data.amount,
    timestamp: ISO8601_NOW,
    actor: data.actor_id
  }

  // 3. SHA-256 the canonical JSON
  payload_hash = SHA256(JSON.stringify(sortKeys(payload)))

  // 4. Insert the audit record
  INSERT INTO audit_log (event_type, ref_id, ref_table, payload_hash, prev_hash, raw_payload)
  VALUES (event_type, ref_id, ref_table, payload_hash, prev_hash, payload)
```

---

## 5. API Routes Plan

| Route | Method | Purpose |
|---|---|---|
| `/api/webhook/donation` | POST | Receives mock 1Link/Raast donation payloads |
| `/api/webhook/expense` | POST | Receives expense/vendor payment notifications |
| `/api/audit/verify` | GET | Verifies the hash chain integrity |
| `/api/analytics/summary` | GET | Returns sector breakdown, funding gaps |
| `/api/seed` | POST | Seeds demo data for presentation |

---

## 6. Frontend Pages

| Route | Component | Status |
|---|---|---|
| `/` | Landing + Live Counter | ⬜ Not Started |
| `/dashboard` | Full Analytics Dashboard | ⬜ Not Started |
| `/flow` | Money Flow Sankey Diagram | ⬜ Not Started |
| `/audit` | Hash Chain Verification UI | ⬜ Not Started |
| `/admin` | NGO Admin Panel (auth-gated) | ⬜ Not Started |

---

## 7. Integration Status

| Integration | Status | Notes |
|---|---|---|
| Supabase Project | ⬜ Not Created | Need to create + get keys |
| Beeceptor Mock | ⬜ Not Created | Will simulate Raast/1Link webhooks |
| Vercel Deploy | ⬜ Not Connected | Will auto-deploy from GitHub |
| GitHub Repo | ✅ Created | https://github.com/maffanz47/White-Box |

---

## 8. Judging Alignment

| Criteria | Weight | Our Strategy |
|---|---|---|
| Relevance to Theme | 25% | Direct "Money Moves" — tracking every rupee in real-time |
| Simplicity & Usability | 20% | One-glance Live Counter, clean dashboard, no signup needed to view |
| Innovation | 20% | SHA-256 hash chain for tamper-evident audit (not blockchain, but provably secure) |
| Technical Execution | 20% | Real-time Supabase, Next.js SSR, Recharts analytics |
| Presentation | 15% | Live demo with mock webhook → instant counter update |
