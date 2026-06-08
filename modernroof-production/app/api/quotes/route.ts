import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET /api/quotes — list recent quotes
export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("quotes")
    .select("id, customer_name, address, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}

// POST /api/quotes — create a new quote
export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = await request.json().catch(() => ({}));

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      customer_name: body.customer_name ?? null,
      address: body.address ?? null,
      measurements: body.measurements ?? null,
      job_details: body.job_details ?? null,
      options: body.options ?? null,
      job_id: body.job_id ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
