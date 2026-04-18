# WhiteBox — Data Flow Architecture & Mind Map
# "Trust-as-a-Service" Transparency Platform for NGO Donations
# Generated: 2026-04-18

==============================================================================
 MIND MAP — TOP LEVEL
==============================================================================

                            [ WhiteBox Platform ]
                                     |
          ┌──────────────┬───────────┴───────────┬──────────────┐
          |              |                        |              |
    [Donor Layer]  [NGO Layer]           [Public Layer]   [Backend Layer]
          |              |                        |              |
    Bank Simulator  NGO Portal            Donor Analytics   API Routes
    Beeceptor Hook  Expense Form          Audit Trail       Supabase DB
    Raast / 1Link   Balance Check         Money Flow Map    Hash Chain

==============================================================================
 STAGE 1 — DONATION FLOW
==============================================================================

  [Donor / Bank / Raast / 1Link]
        |
        | POST JSON:
        | { donor_name, donor_id, amount (paisa), sector,
        |   channel, ngo_id (optional), tx_ref }
        |
        ├── VIA: bank-simulator.html (local demo tool)
        |   └── loads NGO list from /api/ngos at startup
        |   └── sends directly to Vercel /api/webhook/donation
        |
        └── VIA: Beeceptor Proxy
            └── whitebox-test-123456.free.beeceptor.com
            └── proxies to → /api/webhook/donation
        |
        v
  POST /api/webhook/donation
        |
        |— Validate: donor_id, amount > 0, sector (5 allowed values)
        |— INSERT: donations table (status = "confirmed")
        |— FETCH: last audit_log.payload_hash (chain link)
        |— COMPUTE: sha256(payload + prevHash)
        |— INSERT: audit_log (new hash block linked to previous)
        |
        v
  [Supabase Realtime] → INSERT event fires → browser LiveCounter refreshes

==============================================================================
 STAGE 2 — NGO EXPENSE FLOW (with Hard Balance Enforcement)
==============================================================================

  [NGO Admin] → /admin page
        |
        |— SELECT NGO from dropdown (/api/ngos)
        |— VIEW live balance: /api/ngos/[id]/analytics
        |   └── shows: total_received, total_spent, available_balance
        |— FILL expense form
        |— CLIENT-SIDE: warns if amount > available_balance (real-time)
        |
        v
  POST /api/webhook/expense
        |
        |— BALANCE CHECK (server-side, cannot be bypassed):
        |   SUM(donations WHERE ngo_id=X) - SUM(expenses WHERE ngo_id=X)
        |   IF amount > available → 422 Insufficient Balance (blocked)
        |
        |— INSERT: expenses (verified = true)
        |— INSERT: audit_log (chained hash block)
        |
        v
  [Balance decreases, NGO analytics updated, flow map changes]

==============================================================================
 STAGE 3 — DATABASE SCHEMA
==============================================================================

  ngos (Master)
  ├── id (UUID PK)
  ├── name, registration, sector, admin_ratio, verified
  └── relationships → donations.ngo_id, expenses.ngo_id

  donations (Transaction Record)
  ├── id (UUID PK)
  ├── donor_name, donor_id, amount (BIGINT, paisa), channel
  ├── ngo_id (FK → ngos), sector, status, tx_ref (unique)
  └── created_at

  expenses (Spending Record)
  ├── id (UUID PK)
  ├── ngo_id (FK → ngos, NOT NULL)
  ├── amount (BIGINT, paisa), category, vendor_name
  ├── receipt_ref, description, sector, verified
  └── created_at

  audit_log (IMMUTABLE HASH CHAIN)
  ├── id (BIGSERIAL PK — sequential, never skip)
  ├── event_type (donation | expense)
  ├── ref_id (UUID → donations.id or expenses.id)
  ├── actor_id (donor_id or ngo_id)
  ├── payload_hash = sha256(raw_payload as canonical JSON)
  ├── prev_hash = previous block's payload_hash (GENESIS for block 1)
  ├── raw_payload (JSONB — the exact data that was hashed)
  └── created_at

  Chain Property:
  Block[N].prev_hash === Block[N-1].payload_hash
  Tampering Block[K] → hash[K] changes → Block[K+1].prev_hash no longer matches → CHAIN BROKEN

==============================================================================
 STAGE 4 — API ROUTES MAP
==============================================================================

  READ ROUTES (server-side admin client, bypasses RLS):
  ┌──────────────────────────────────────────────────────────────┐
  │ GET /api/totals               → Global donation/expense sums │
  │ GET /api/ngos                 → All verified NGOs list       │
  │ GET /api/ngos/[id]/analytics  → Per-NGO financial breakdown  │
  │ GET /api/ngos/[id]/expenses   → Recent expenses for one NGO  │
  │ GET /api/audit/entries        → All audit blocks (desc)      │
  │ GET /api/audit/verify         → Re-verify full hash chain    │
  │ GET /api/flow                 → Sankey diagram data          │
  │ GET /api/analytics/summary    → Global sector breakdown      │
  └──────────────────────────────────────────────────────────────┘

  WRITE ROUTES (service_role key, validates before insert):
  ┌──────────────────────────────────────────────────────────────┐
  │ POST /api/webhook/donation → Insert donation + audit block   │
  │ POST /api/webhook/expense  → Balance check → insert expense  │
  │ POST /api/seed             → Initial demo data setup         │
  │ POST /api/reset            → Clear transactions + re-seed    │
  └──────────────────────────────────────────────────────────────┘

==============================================================================
 STAGE 5 — PAGE-TO-DATA MAPPING
==============================================================================

  PAGE               DATA SOURCE                    REALTIME?
  ─────────────────────────────────────────────────────────────
  / (Home)           /api/totals (via LiveCounter)   Yes (+ 10s poll)
  /dashboard         /api/ngos → /api/ngos/[id]/analytics  No (on select)
  /flow              /api/flow                       No (on load)
  /audit             /api/audit/entries              No (on load)
                     /api/audit/verify               On button click
  /admin             /api/ngos + /api/ngos/[id]/analytics + /api/ngos/[id]/expenses
  bank-simulator.html /api/ngos (startup load)       No
                      POST /api/webhook/donation      On click

==============================================================================
 STAGE 6 — SECURITY MODEL
==============================================================================

  Keys:
  ├── NEXT_PUBLIC_SUPABASE_URL         → Public, safe (just the project URL)
  ├── NEXT_PUBLIC_SUPABASE_ANON_KEY    → Public, used only for Realtime WS
  └── SUPABASE_SERVICE_ROLE_KEY        → SECRET, server-side only, all writes

  RLS Policies:
  ├── SELECT: public (anon key can read all tables — transparency by design)
  └── INSERT/UPDATE: allowed with service_role only (API routes enforce this)

  Environment:
  ├── Local: .env.local (git-ignored)
  └── Production: Vercel Project Settings → Environment Variables

==============================================================================
 STAGE 7 — END-TO-END LIFECYCLE (Single Donation)
==============================================================================

  1.  bank-simulator.html loads → fetches NGO list from /api/ngos
  2.  User selects: Edhi Foundation, Rs 50,000, Health, Raast
  3.  Click "Send Transfer Webhook"
  4.  POST /api/webhook/donation with: { ngo_id: "...", amount: 5000000, ... }
  5.  Server validates payload
  6.  INSERT: donations row (status: confirmed)
  7.  FETCH: last audit_log.payload_hash = "abc123..."
  8.  COMPUTE: sha256("{ prevHash: 'abc123...', eventType: 'donation', amount: 5000000, ... }")
              = "def456..."
  9.  INSERT: audit_log { payload_hash: "def456...", prev_hash: "abc123...", ... }
  10. API returns: { success: true, donation_id, audit_hash: "def456..." }
  11. Supabase fires Realtime INSERT event on donations table
  12. Browser LiveCounter receives event → calls /api/totals
  13. Animated counter ticks up by Rs 50,000 on every open tab
  14. /dashboard: Edhi Foundation card now shows +Rs 50,000 in Total Received
  15. /flow: Sankey shows wider band from "Donations Pool" to "Edhi Foundation"
  16. /audit: New block #38 appears with hash "def456..." linked to "abc123..."
  17. NGO Admin opens /admin, selects Edhi Foundation
  18. Sees: Available Balance = Rs 50,000 (just received)
  19. Submits expense: Rs 20,000, Direct Aid, Pakistan Medical Supplies
  20. POST /api/webhook/expense
  21. Server computes: 5,000,000 paisa received - 0 spent = 5,000,000 available
  22. 2,000,000 <= 5,000,000 → ALLOWED
  23. INSERT: expenses row (verified: true)
  24. INSERT: audit_log block #39
  25. /admin balance updates: Available = Rs 30,000
  26. /flow: Sankey shows band from "Edhi Foundation" → "Direct Aid"
  27. /audit: Block #39 visible, click to expand raw payload + SHA-256 hash
