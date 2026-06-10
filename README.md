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

**Sprint 1 — Foundation** (complete in codebase)

- Multi-brand Supabase schema + RLS
- Brand context hook (`useBrand()`) with dynamic theming
- Auth + middleware
- Studio, staff, and KPI config admin screens
- Sidebar navigation shell

Sprints 2–8 (clients, booking, POS, KPI dashboard, etc.) are planned per the Vibe Coding Playbook.
