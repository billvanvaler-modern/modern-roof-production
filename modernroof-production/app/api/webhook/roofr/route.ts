/**
 * POST /api/webhook/roofr
 *
 * Receives Roofr CRM pipeline webhooks. When a job moves into the
 * "Quoting" stage in Roofr, this creates a job record in Supabase
 * so it appears on the Pre-Production dashboard immediately.
 *
 * Setup in Roofr:
 *   Webhook URL:  https://production.modernroof.com/api/webhook/roofr
 *   Trigger:      Stage changed → Quoting (or whichever stage name you use)
 *   Secret token: Set ROOFR_WEBHOOK_SECRET in Vercel env vars, then paste
 *                 the same value into Roofr's "Signing Secret" field.
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Roofr payload normalizer ────────────────────────────────────────────────
// Roofr's webhook payload nests data differently depending on the event type.
// This function tries several common paths so the endpoint is resilient to
// minor format differences.

interface NormalizedJob {
  roofrId:      string | null;
  customerName: string;
  phone:        string | null;
  email:        string | null;
  street:       string | null;
  city:         string | null;
  state:        string | null;
  zip:          string | null;
  salesRep:     string | null;
  stage:        string | null;
}

function normalize(body: Record<string, unknown>): NormalizedJob {
  // Top-level convenience aliases
  const data   = (body.data   ?? body.opportunity ?? body.lead ?? body) as Record<string, unknown>;
  const cust   = (data.customer ?? data.contact ?? data.client ?? {}) as Record<string, unknown>;
  const addr   = (data.address  ?? data.property ?? data.location ?? {}) as Record<string, unknown>;
  const rep    = (data.assigned_to ?? data.assignee ?? data.owner ?? {}) as Record<string, unknown>;

  // Customer name — try combined, then first+last, then fallback to company
  const firstName  = str(cust.first_name ?? cust.firstName);
  const lastName   = str(cust.last_name  ?? cust.lastName);
  const fullName   = str(cust.name ?? cust.full_name ?? data.customer_name ?? data.name);
  const customerName =
    fullName ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    str(cust.company) ||
    "Unknown Customer";

  // Street address — try structured then free-form
  const street =
    str(addr.line1 ?? addr.street ?? addr.address1 ?? addr.street_address) ||
    str(data.address ?? data.street);

  // Stage — normalize to lowercase for comparison
  const stage = str(
    data.stage ?? data.pipeline_stage ?? data.status ?? body.stage ?? body.event_type
  );

  return {
    roofrId:      str(data.id ?? body.id ?? null),
    customerName,
    phone:        str(cust.phone ?? cust.mobile ?? data.phone ?? null),
    email:        str(cust.email ?? data.email ?? null),
    street,
    city:         str(addr.city ?? data.city ?? null),
    state:        str(addr.state ?? addr.state_code ?? data.state ?? null),
    zip:          str(addr.zip ?? addr.postal_code ?? addr.postcode ?? data.zip ?? null),
    salesRep:     str(rep.name ?? rep.full_name ?? data.sales_rep ?? null),
    stage,
  };
}

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

// ─── Stage check ─────────────────────────────────────────────────────────────
// Roofr uses various stage names — match anything that looks like "quoting".
// Add more patterns here if needed.

const QUOTING_PATTERNS = [
  /quoting/i,
  /quote/i,
  /pricing/i,
  /proposal/i,
  /estimate/i,
];

function isQuotingStage(stage: string | null): boolean {
  if (!stage) return false;
  return QUOTING_PATTERNS.some(re => re.test(stage));
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // ── 1. Optional secret verification ─────────────────────────────────────
  const secret = process.env.ROOFR_WEBHOOK_SECRET;
  if (secret) {
    const provided =
      request.headers.get("x-roofr-signature") ??
      request.headers.get("x-webhook-secret") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (provided !== secret) {
      console.warn("[roofr-webhook] invalid secret — rejected");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Always log in non-production so you can inspect the exact payload shape
  if (process.env.NODE_ENV !== "production") {
    console.log("[roofr-webhook] received:", JSON.stringify(body, null, 2));
  } else {
    console.log("[roofr-webhook] event received, type:", body.event ?? body.type ?? "unknown");
  }

  // ── 3. Normalize payload ──────────────────────────────────────────────────
  const job = normalize(body);

  // ── 4. Stage gate — only proceed if this is a Quoting-stage event ─────────
  // If Roofr is configured to only fire for "Quoting" stage, skip this check
  // by leaving ROOFR_SKIP_STAGE_CHECK=true in env.
  const skipStageCheck = process.env.ROOFR_SKIP_STAGE_CHECK === "true";
  if (!skipStageCheck && !isQuotingStage(job.stage)) {
    console.log(`[roofr-webhook] stage "${job.stage}" — skipping (not Quoting)`);
    return NextResponse.json({ ok: true, skipped: true, reason: "not quoting stage" });
  }

  // ── 5. Write to Supabase ──────────────────────────────────────────────────
  const supabase = getSupabase();
  if (!supabase) {
    console.error("[roofr-webhook] Supabase not configured");
    // Return 200 anyway so Roofr doesn't keep retrying
    return NextResponse.json({ ok: true, warning: "DB unavailable — job not saved" });
  }

  // Deduplicate by roofr_id if the column exists; fall through gracefully if not
  if (job.roofrId) {
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("roofr_id", job.roofrId)
      .maybeSingle();

    if (existing) {
      console.log(`[roofr-webhook] duplicate — job ${existing.id} already exists for roofr_id ${job.roofrId}`);
      return NextResponse.json({ ok: true, duplicate: true, jobId: existing.id });
    }
  }

  const insertPayload: Record<string, unknown> = {
    customer_name: job.customerName,
    phone:         job.phone,
    email:         job.email,
    address:       job.street,
    city:          job.city,
    state:         job.state,
    zip:           job.zip,
    sales_rep:     job.salesRep,
    status:        "not_started",
    // Store the raw Roofr ID for deduplication — requires column in jobs table
    // (see README for SQL). Gracefully ignored if column doesn't exist.
    roofr_id:      job.roofrId,
  };

  const { data: created, error } = await supabase
    .from("jobs")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    // If roofr_id column doesn't exist yet, retry without it
    if (error.code === "42703" && error.message.includes("roofr_id")) {
      delete insertPayload.roofr_id;
      const { data: created2, error: error2 } = await supabase
        .from("jobs")
        .insert(insertPayload)
        .select("id")
        .single();
      if (error2) {
        console.error("[roofr-webhook] insert failed:", error2.message);
        return NextResponse.json({ ok: true, warning: error2.message });
      }
      console.log(`[roofr-webhook] created job ${created2.id} (no roofr_id column yet)`);
      return NextResponse.json({ ok: true, jobId: created2.id });
    }

    console.error("[roofr-webhook] insert failed:", error.message);
    return NextResponse.json({ ok: true, warning: error.message });
  }

  console.log(`[roofr-webhook] ✓ created job ${created.id} for "${job.customerName}"`);
  return NextResponse.json({ ok: true, jobId: created.id });
}

// Roofr sometimes sends a HEAD or GET to verify the endpoint is alive
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "roofr-webhook" });
}
