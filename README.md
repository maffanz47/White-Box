# 🔲 WhiteBox

> **"Trust-as-a-Service" — Where Every Rupee Tells the Truth**

Real-time, cryptographically verified transparency for NGO donations in Pakistan.
Built for **Micathon '26** — "Money Moves" theme.

[![Live](https://img.shields.io/badge/status-live-34d399?style=flat-square&labelColor=0f1117)](https://github.com/maffanz47/White-Box)
[![Next.js](https://img.shields.io/badge/Next.js-15-6366f1?style=flat-square&labelColor=0f1117)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-6366f1?style=flat-square&labelColor=0f1117)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/deployed-Vercel-6366f1?style=flat-square&labelColor=0f1117)](https://vercel.com)

---

## What It Does

WhiteBox is a transparency layer that sits between a bank payment and the public. The moment a donation lands via **Raast** or **1Link**, it is recorded, SHA-256 hashed, and visible to anyone — in real time, with no refresh required.

Every rupee in. Every rupee out. Publicly, permanently, and tamper-evidently accounted for.

---

## Platform Portals

| Route | Portal | Who It's For |
|---|---|---|
| `/` | Home + Live Counter | Everyone |
| `/dashboard` | Donor Analytics | Donors tracking their contributions |
| `/flow` | Money Flow Map | Visual Sankey — rupees to sectors |
| `/audit` | Audit Trail | Chain integrity verification |
| `/admin` | NGO Portal | NGO admins logging verified expenses |
| `/how-it-works` | Technical Walkthrough | Judges, journalists, developers |

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR + serverless API routes, free on Vercel |
| Database | Supabase Postgres | Relational integrity, Row Level Security |
| Realtime | Supabase Realtime (WebSocket) | Push updates to live counter without polling |
| Integrity | SHA-256 (Web Crypto API) | Browser-native, zero dependencies |
| Charts | Recharts | Sankey + Pie + Bar — composable and lightweight |
| Mock Gateway | Beeceptor + HTML Simulator | Simulates Raast/1Link webhooks for demo |
| Deployment | Vercel | Auto-deploy from GitHub, global CDN |
| Language | TypeScript | Type safety across frontend and all API routes |

---

## How the Audit Chain Works

Every donation and expense creates a new block in the `audit_log` table:

```
Block[N].prev_hash === Block[N-1].payload_hash
```

Changing **any** historical record changes its SHA-256 hash, which breaks every block after it. Tampering is cryptographically detectable by anyone, in seconds, via the Audit Trail page.

**This is not a blockchain.** No tokens, no gas, no distributed consensus. Just a tamper-evident append-only log using the same hash standard as TLS and Bitcoin.

---

## Data Flow

```
Bank / Simulator → Beeceptor Proxy → POST /api/webhook/donation
    → Validate payload
    → INSERT donations row
    → FETCH prev audit hash
    → SHA-256(payload + prevHash)
    → INSERT audit_log block
    → Supabase Realtime fires
    → LiveCounter ticks up on every open tab
```

Full architecture: [`DATA_FLOW_ARCHITECTURE.md`](./DATA_FLOW_ARCHITECTURE.md)

---

## API Routes

### Read (public, anon key)
| Route | Returns |
|---|---|
| `GET /api/totals` | Global donation + expense sums |
| `GET /api/ngos` | All verified NGOs |
| `GET /api/ngos/[id]/analytics` | Per-NGO financial breakdown |
| `GET /api/ngos/[id]/expenses` | Recent expenses for one NGO |
| `GET /api/audit/entries` | Full audit log (descending) |
| `GET /api/audit/verify` | Re-verify entire hash chain |
| `GET /api/flow` | Sankey diagram data |
| `GET /api/analytics/summary` | Global sector breakdown |

### Write (server-side, service_role key only)
| Route | Action |
|---|---|
| `POST /api/webhook/donation` | Record donation + create audit block |
| `POST /api/webhook/expense` | Balance check → record expense + audit block |
| `POST /api/seed` | Seed initial demo data |
| `POST /api/reset` | Clear transactions and re-seed |

---

## Local Development

### 1. Clone & install

```bash
git clone https://github.com/maffanz47/White-Box.git
cd White-Box
npm install
```

### 2. Environment variables

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` is **server-side only** — never exposed to the browser.

### 3. Seed the database

```bash
curl -X POST http://localhost:3000/api/seed
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Demo a donation

Open `public/bank-simulator.html` in your browser.  
Select an NGO, enter an amount, pick a sector, and click **Send Transfer Webhook**.  
Watch the Live Counter tick up in real time.

---

## Security Model

- All **writes** use the `SUPABASE_SERVICE_ROLE_KEY` — server-side API routes only. No client code touches the database.
- All **reads** use the public `ANON_KEY` — transparency is the product, public read is by design.
- **RLS** is enabled on all tables. INSERT/UPDATE is locked to `service_role`. SELECT is open.
- **Balance enforcement** is server-side. An NGO cannot log expenses exceeding confirmed incoming donations — the API returns `HTTP 422` if attempted.

---

## Judging Alignment (Micathon '26)

| Criterion | Weight | How WhiteBox addresses it |
|---|---|---|
| Relevance to Theme | 25% | "Money Moves" — every rupee tracked in real time |
| Simplicity & Usability | 20% | One-glance Live Counter, no signup to view |
| Innovation | 20% | SHA-256 hash chain audit — tamper-evident, not blockchain |
| Technical Execution | 20% | Full-stack, live-deployed, Supabase Realtime |
| Presentation | 15% | Live bank simulator demo → instant counter update |

---

## Project Structure

```
white-box/
├── public/
│   └── bank-simulator.html     # Standalone donation demo tool
├── src/
│   ├── app/
│   │   ├── page.tsx            # Home — Live Counter + portal grid
│   │   ├── dashboard/          # Donor Analytics
│   │   ├── flow/               # Money Flow Sankey
│   │   ├── audit/              # Hash Chain Verification
│   │   ├── admin/              # NGO Portal
│   │   ├── how-it-works/       # Technical walkthrough
│   │   └── api/                # All API routes
│   └── components/
│       ├── Navbar.tsx
│       ├── LiveCounter.tsx
│       └── MoneyFlowSankey.tsx
├── DATA_FLOW_ARCHITECTURE.md   # Full data flow + mind map
└── PROJECT_TRUTH.md            # Canonical project decisions
```

---

## License

MIT — built at Micathon '26.
