# Salon Platform — Sprint 1 Setup

Multi-brand salon management platform. First brand: **Buff Nail Studios**.

## Prerequisites

- Node.js 18+
- Supabase project in **Sydney (ap-southeast-2)**

## 1. Install dependencies

```bash
npm install
```

## 2. Run Supabase migration

Open the Supabase SQL Editor and run the full contents of:

```
supabase/migrations/001_sprint1_foundation.sql
```

This creates all Sprint 1 tables, RLS policies, and Buff seed data (brand, 6 KPIs, 8 studios).

## 3. Configure environment

Copy `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BRAND_ID=<brand_id from brands table>
```

Get the brand ID:

```sql
SELECT brand_id FROM brands WHERE slug = 'buff';
```

## 4. Create an admin user

1. In Supabase Dashboard → Authentication → Users, create a user with email/password.
2. Link the user to Buff as super_admin:

```sql
INSERT INTO user_roles (user_id, brand_id, role)
SELECT
  '<your-auth-user-uuid>',
  brand_id,
  'super_admin'
FROM brands WHERE slug = 'buff';
```

## 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

## Sprint 1 verification

- Sidebar shows **Buff Nail Studios** from the database
- `/admin/studios` lists 8 studios including Williamstown (JV, 50%, Shinae Caruso)
- `/admin/kpi-config` shows 6 KPIs with editable thresholds
- Inspect `<html>` — CSS variables `--colour-primary`, `--colour-accent`, `--colour-surface` are set

## Project structure

| Path | Purpose |
|------|---------|
| `lib/brand.tsx` | `useBrand()` hook + React context |
| `lib/supabase/` | Browser/server Supabase clients |
| `middleware.ts` | Auth protection (all routes except `/login`) |
| `app/(dashboard)/` | Authenticated app shell with sidebar |
| `app/login/` | Brand-themed login page |
| `types/database.ts` | Supabase TypeScript types |
