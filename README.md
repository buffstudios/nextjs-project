# Salon Platform

Multi-brand salon management platform built with Next.js 14, Supabase, Tailwind CSS, and shadcn/ui.

First brand: **Buff Nail Studios** (8 Melbourne studios).

## Quick start

See [docs/SPRINT1_SETUP.md](docs/SPRINT1_SETUP.md) for full setup instructions.

```bash
npm install
npm run dev
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for multi-brand and payment abstraction principles.

## Current status

**Sprint 1 — Foundation** ✓  
**Sprint 2 — Client Profiles** ✓

- Client list with search, filters, retention badges
- Client detail with visit/metrics/communications tabs
- New client form with AU mobile validation + duplicate detection
- `client_metrics` view (visit data populates in Sprint 3)

See [docs/SPRINT2_SETUP.md](docs/SPRINT2_SETUP.md) for Sprint 2 SQL migration.

Sprints 3–8 (booking, POS, KPI dashboard, etc.) are planned per the Vibe Coding Playbook.
