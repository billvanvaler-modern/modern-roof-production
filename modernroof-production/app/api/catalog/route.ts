import { createClient } from "@supabase/supabase-js";
import { DEFAULT_CATALOG } from "@/lib/catalog";
import type { ShingleProduct } from "@/lib/types";
import { NextResponse } from "next/server";

// ─── Column mapping ────────────────────────────────────────────────────────────
// Postgres uses snake_case; our TypeScript types use camelCase.

interface ProductRow {
  id: string;
  name: string;
  distributor: string;
  description: string;
  cost_per_bundle: number;
  bundles_per_square: number;
  includes_pipeboots: boolean;
  includes_warranty: boolean;
  hip_ridge_cost_per_bundle: number;
  starter_cost_per_bundle: number;
  underlayment_cost_per_roll: number;
  ice_water_cost_per_roll: number;
  ridge_vent_cost_per_4ft: number;
  pipe_jack_cost: number;
  hip_ridge_lf_per_bundle: number;
  starter_lf_per_bundle: number;
  underlayment_sq_per_roll: number;
  ice_water_lf_per_roll: number;
  sort_order: number;
}

function fromRow(row: ProductRow): ShingleProduct {
  return {
    id: row.id,
    name: row.name,
    distributor: row.distributor,
    description: row.description,
    costPerBundle: row.cost_per_bundle,
    bundlesPerSquare: row.bundles_per_square,
    includesPipeboots: row.includes_pipeboots,
    includesWarranty: row.includes_warranty,
    hipRidgeCostPerBundle: row.hip_ridge_cost_per_bundle,
    starterCostPerBundle: row.starter_cost_per_bundle,
    underlaymentCostPerRoll: row.underlayment_cost_per_roll,
    iceWaterCostPerRoll: row.ice_water_cost_per_roll,
    ridgeVentCostPer4ft: row.ridge_vent_cost_per_4ft,
    pipeJackCost: row.pipe_jack_cost,
    hipRidgeLfPerBundle: row.hip_ridge_lf_per_bundle ?? 31,
    starterLfPerBundle: row.starter_lf_per_bundle ?? 114,
    underlaymentSqPerRoll: row.underlayment_sq_per_roll ?? 10,
    iceWaterLfPerRoll: row.ice_water_lf_per_roll ?? 66,
    sortOrder: row.sort_order ?? 0,
  };
}

function toRow(p: ShingleProduct, index?: number): Omit<ProductRow, never> {
  return {
    id: p.id,
    name: p.name,
    distributor: p.distributor,
    description: p.description,
    cost_per_bundle: p.costPerBundle,
    bundles_per_square: p.bundlesPerSquare,
    includes_pipeboots: p.includesPipeboots,
    includes_warranty: p.includesWarranty,
    hip_ridge_cost_per_bundle: p.hipRidgeCostPerBundle,
    starter_cost_per_bundle: p.starterCostPerBundle,
    underlayment_cost_per_roll: p.underlaymentCostPerRoll,
    ice_water_cost_per_roll: p.iceWaterCostPerRoll,
    ridge_vent_cost_per_4ft: p.ridgeVentCostPer4ft,
    pipe_jack_cost: p.pipeJackCost,
    hip_ridge_lf_per_bundle: p.hipRidgeLfPerBundle ?? 31,
    starter_lf_per_bundle: p.starterLfPerBundle ?? 114,
    underlayment_sq_per_roll: p.underlaymentSqPerRoll ?? 10,
    ice_water_lf_per_roll: p.iceWaterLfPerRoll ?? 66,
    sort_order: index !== undefined ? index : (p.sortOrder ?? 0),
  };
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer service role key (bypasses RLS); fall back to anon key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET /api/catalog
export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    // Local dev without env vars — return defaults
    return NextResponse.json(DEFAULT_CATALOG);
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Supabase GET error:", error.message);
    return NextResponse.json(DEFAULT_CATALOG);
  }

  // First-time setup: seed defaults if table is empty
  if (!data || data.length === 0) {
    const { error: seedError } = await supabase
      .from("products")
      .insert(DEFAULT_CATALOG.map(toRow));
    if (seedError) console.error("Seed error:", seedError.message);
    return NextResponse.json(DEFAULT_CATALOG);
  }

  return NextResponse.json((data as ProductRow[]).map(fromRow));
}

// POST /api/catalog — replace the entire catalog
export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  const products = (await request.json()) as ShingleProduct[];

  // Find IDs to delete (in DB but not in new list)
  const { data: current } = await supabase.from("products").select("id");
  const currentIds = (current ?? []).map((r: { id: string }) => r.id);
  const newIds = products.map((p) => p.id);
  const toDelete = currentIds.filter((id) => !newIds.includes(id));

  if (toDelete.length > 0) {
    const { error } = await supabase.from("products").delete().in("id", toDelete);
    if (error) console.error("Delete error:", error.message);
  }

  if (products.length > 0) {
    // Pass the array index so sort_order always reflects the saved order
    const { error } = await supabase.from("products").upsert(products.map((p, i) => toRow(p, i)));
    if (error) {
      console.error("Upsert error:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
