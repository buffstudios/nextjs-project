# Sprint 2 Setup — Client Profiles

Run after Sprint 1 is complete and working.

## 1. Run SQL migration

In Supabase SQL Editor, run the full contents of:

```
supabase/migrations/002_sprint2_clients.sql
```

This creates:
- `clients` table (brand-scoped, unique mobile per brand)
- `client_communication_log` table
- `client_metrics` view (visit metrics populate in Sprint 3)
- RLS policies

## 2. Pull latest code

```bash
git fetch origin
git checkout cursor/sprint-2-client-profiles-0c75
npm install
npm run dev
```

## 3. Verify

- Go to **Clients** in the sidebar
- Click **New client** and create a test client (mobile: `0412345678`)
- Try creating the same mobile again — duplicate detection should block it
- Click the client row to open the detail page with tabs
- Retention badges use brand CSS variables (accent colour for Active)

## Notes

- Visit history, rebooking rate, and staff portability metrics show placeholders until Sprints 3–4
- `client_metrics` view will be updated in Sprint 3 when appointments exist
- All invoice amounts display with brand `tax_label` (e.g. ex-GST for Buff)
