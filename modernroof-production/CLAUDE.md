# Modern Roof Quote Generator — Project Context

## What this is
An internal tool for Modern Roof (a roofing contractor) to generate quotes, track jobs, and manage the pre-production workflow. Not a public-facing product — one team uses it.

## Stack
- **Next.js 15** App Router, **React 18**, **TypeScript**, **Tailwind CSS v3**
- **Supabase** (Postgres) — service role key bypasses RLS (RLS is disabled on `jobs` table)
- Deployed on **Vercel** at `https://production.modernroof.com`
- Git remote: `https://github.com/billvanvaler-modern/modern-roof-production`
- **No local node_modules** — Vercel builds remotely. Run `npm install` first if you need local dev.

## Git workflow
- Terminal `git push` doesn't work (auth issue) — always push via **GitHub Desktop**

## Environment variables (needed in `.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ROOFR_WEBHOOK_SECRET=       # optional — for Roofr CRM webhook verification
ROOFR_SKIP_STAGE_CHECK=     # set to "true" to accept all Roofr webhook events
```

## Supabase tables
- **`jobs`** — main job record. Key columns: `customer_name`, `phone`, `email`, `address`, `city`, `state`, `zip`, `sales_rep`, `status`, `quote_data` (JSONB), `roofr_id` (for dedup). RLS is **disabled**.
- **`quotes`** — draft/sent quotes. Has `job_id` FK to link quote → job.
- **`preproduction`** — pre-production form submissions, FK to `jobs`.
- **`catalog`** — shingle products. Column is named `distributor` in DB but mapped to `manufacturer` in app code (see `app/api/catalog/route.ts` `fromRow`/`toRow`).

## Job workflow (4 steps)
1. **Job created** — manually via dashboard or auto-pushed from Roofr CRM webhook
2. **Quote built** — full quote wizard (5 steps: measurements → job details → review → options → quote)
3. **Pre-Production** — form submitted after quote accepted
4. **Production** — placeholder, not yet built

## Key files
| File | Purpose |
|------|---------|
| `app/page.jsx` | Dashboard — job list, filter tabs, inline "+ Add Job" form |
| `app/job/[id]/page.jsx` | Job detail page — workflow stepper, or pre-production form if quote exists |
| `app/quotes/[id]/page.jsx` | Full quote wizard (5-step) |
| `app/settings/page.tsx` | Catalog/product management UI |
| `lib/calculateQuote.ts` | All pricing math + full audit trail |
| `lib/pricing.ts` | All pricing constants — **edit here to change prices** |
| `lib/types.ts` | TypeScript types (`JobDetails`, `QuoteResult`, `AuditGroup`, etc.) |
| `lib/catalog.ts` | Default product catalog (seeded into Supabase) |
| `app/api/jobs/route.ts` | POST — create job manually, or receive "Send to Production" from quote |
| `app/api/quotes/route.ts` | POST — create draft quote, optionally linked to a job via `job_id` |
| `app/api/catalog/route.ts` | GET/POST/PUT/DELETE for shingle products |
| `app/api/webhook/roofr/route.ts` | Receives Roofr CRM pipeline webhooks → creates jobs |

## Pricing constants (lib/pricing.ts)
All prices live here. Key ones to know:
- `UPGRADE_PRICE.guttersPerFt` — price per lf of gutter (currently $12)
- `UPGRADE_PRICE.downspout1stFt` — equivalent gutter footage per 1-story downspout (currently 13 ft)
- `UPGRADE_PRICE.downspout2ndFt` — equivalent gutter footage per 2-story downspout (currently 23 ft)
- `UPGRADE_PRICE.gutterGuardsPerFt` — price per lf of gutter guard (currently $12)
- `COMMISSION_RATE` — 8%

## Gutter upgrade calculation
Effective gutter footage = `gutterFeet1st + gutterFeet2nd + (downspouts1st × 13) + (downspouts2nd × 23)`. The downspout footage constants are configurable in `lib/pricing.ts`.

## Roofr webhook
- URL: `https://production.modernroof.com/api/webhook/roofr`
- Fires when a job moves to "Quoting" stage in Roofr CRM
- Deduplicates by `roofr_id` column (requires `ALTER TABLE jobs ADD COLUMN roofr_id text;` if not present)
- Returns 200 always so Roofr doesn't retry on errors

## Terminology
- DB column is `distributor`, app everywhere calls it **manufacturer** (mapped in API layer)
- "Squares" = roofing unit, 100 sq ft
- Audit trail = collapsible calculation breakdown shown on the quote page (5 groups)

## What's NOT built yet
- Production step (step 4 in the workflow) — just a placeholder card
- Settings UI for downspout footage values (currently edit `lib/pricing.ts` directly)
