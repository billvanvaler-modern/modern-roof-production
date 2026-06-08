import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// POST /api/jobs — create a job from a finalized quote OR manually
export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = await request.json();
  const { quoteId, measurements, jobDetails, options, results } = body;

  // ── Manual job creation (no quoteId / measurements) ──────────────────────
  if (!quoteId && !measurements) {
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        customer_name: body.customer_name ?? null,
        phone:         body.phone         ?? null,
        email:         body.email         ?? null,
        address:       body.address       ?? null,
        city:          body.city          ?? null,
        state:         body.state         ?? null,
        zip:           body.zip           ?? null,
        sales_rep:     body.sales_rep     ?? null,
        status:        "not_started",
      })
      .select("*, preproduction(id, submitted_at)")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(job);
  }

  // Parse city/state/zip out of the address string if present
  // Address format from Roofr: "123 Main St, Indianapolis, IN 46240"
  const addressParts = (measurements?.address ?? "").split(",").map((s: string) => s.trim());
  const street = addressParts[0] ?? measurements?.address ?? "";
  const city = addressParts[1] ?? null;
  const stateZip = addressParts[2] ?? null;
  const state = stateZip ? stateZip.split(" ")[0] : null;
  const zip = stateZip ? stateZip.split(" ")[1] : null;

  // Create the job
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      customer_name: measurements?.customerName ?? null,
      phone: measurements?.phone ?? null,
      email: measurements?.email ?? null,
      address: street,
      city,
      state,
      zip,
      status: "not_started",
      quote_data: { measurements, jobDetails, options, results },
    })
    .select("id")
    .single();

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  // Mark the quote as sent and link to job
  if (quoteId) {
    await supabase
      .from("quotes")
      .update({ status: "sent", job_id: job.id, updated_at: new Date().toISOString() })
      .eq("id", quoteId);
  }

  return NextResponse.json({ jobId: job.id });
}
