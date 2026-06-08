import type { ShingleProduct } from "./types";

export const DEFAULT_CATALOG: ShingleProduct[] = [
  {
    id: "atlas-castlebrook",
    name: "Atlas Castlebrook",
    distributor: "Atlas",
    description:
      "Castlebrook® shingles provide excellent protection with a warranty covering winds up to 130 mph. Elegant architectural look in seven color options. Unrated Class 2 Impact. Limited Lifetime Warranty.",
    costPerBundle: 35.0,
    bundlesPerSquare: 3,
    includesPipeboots: false,
    includesWarranty: false,
    hipRidgeCostPerBundle: 80.5,
    starterCostPerBundle: 83.55,
    underlaymentCostPerRoll: 101.0,
    iceWaterCostPerRoll: 89.0,
    ridgeVentCostPer4ft: 17.9,
    pipeJackCost: 10.6,
    hipRidgeLfPerBundle: 31,
    starterLfPerBundle: 114,
    underlaymentSqPerRoll: 10,
    iceWaterLfPerRoll: 66,
    sortOrder: 0,
  },
  {
    id: "atlas-pinnacle-pristine",
    name: "Atlas Pinnacle Pristine",
    distributor: "Atlas",
    description:
      "Pinnacle® Pristine shingles offer Class 3 impact resistance, winds up to 130 mph, and 3M™ Scotchgard™ Protector. Available in 16 colors. Limited Lifetime Warranty with 15-year non-prorated period.",
    costPerBundle: 35.0,
    bundlesPerSquare: 3,
    includesPipeboots: false,
    includesWarranty: false,
    hipRidgeCostPerBundle: 80.5,
    starterCostPerBundle: 83.55,
    underlaymentCostPerRoll: 101.0,
    iceWaterCostPerRoll: 89.0,
    ridgeVentCostPer4ft: 17.9,
    pipeJackCost: 10.6,
    hipRidgeLfPerBundle: 31,
    starterLfPerBundle: 114,
    underlaymentSqPerRoll: 10,
    iceWaterLfPerRoll: 66,
    sortOrder: 1,
  },
  {
    id: "malarkey-highlander",
    name: "Malarkey Highlander",
    distributor: "Malarkey",
    description:
      "NEX® Rubberized Asphalt SBS polymer-modified shingle with Class 3 hail impact rating. Algae-resistant granules. Limited Lifetime Warranty with 10-year non-prorated period.",
    costPerBundle: 42.0,
    bundlesPerSquare: 3,
    includesPipeboots: false,
    includesWarranty: false,
    hipRidgeCostPerBundle: 82.0,
    starterCostPerBundle: 68.0,
    underlaymentCostPerRoll: 89.95,
    iceWaterCostPerRoll: 63.87,
    ridgeVentCostPer4ft: 16.63,
    pipeJackCost: 10.6,
    hipRidgeLfPerBundle: 31,
    starterLfPerBundle: 114,
    underlaymentSqPerRoll: 10,
    iceWaterLfPerRoll: 66,
    sortOrder: 2,
  },
  {
    id: "malarkey-vista",
    name: "Malarkey Vista",
    distributor: "Malarkey",
    description:
      "NEX® Rubberized Asphalt SBS polymer-modified shingle with Class 4 hail impact rating. Emerald Pro Warranty included — 50-year non-prorated period & Lifetime Pipeboots.",
    costPerBundle: 45.32,
    bundlesPerSquare: 3,
    includesPipeboots: true,
    includesWarranty: true,
    hipRidgeCostPerBundle: 82.0,
    starterCostPerBundle: 68.0,
    underlaymentCostPerRoll: 89.95,
    iceWaterCostPerRoll: 63.87,
    ridgeVentCostPer4ft: 16.63,
    pipeJackCost: 60.0,
    hipRidgeLfPerBundle: 31,
    starterLfPerBundle: 114,
    underlaymentSqPerRoll: 10,
    iceWaterLfPerRoll: 66,
    sortOrder: 3,
  },
  {
    id: "malarkey-legacy",
    name: "Malarkey Legacy",
    distributor: "Malarkey",
    description:
      "NEX® Rubberized Asphalt SBS polymer-modified shingle with Class 4 hail impact rating. Scotchgard™ granules. Emerald Pro Warranty included — 50-year non-prorated period & Lifetime Pipeboots.",
    costPerBundle: 47.55,
    bundlesPerSquare: 4,
    includesPipeboots: true,
    includesWarranty: true,
    hipRidgeCostPerBundle: 82.0,
    starterCostPerBundle: 68.0,
    underlaymentCostPerRoll: 89.95,
    iceWaterCostPerRoll: 63.87,
    ridgeVentCostPer4ft: 16.63,
    pipeJackCost: 60.0,
    hipRidgeLfPerBundle: 31,
    starterLfPerBundle: 114,
    underlaymentSqPerRoll: 10,
    iceWaterLfPerRoll: 66,
    sortOrder: 4,
  },
];

// ─── API-backed catalog (used in production) ──────────────────────────────────

export async function fetchCatalog(): Promise<ShingleProduct[]> {
  try {
    const res = await fetch("/api/catalog", { cache: "no-store" });
    if (!res.ok) return [...DEFAULT_CATALOG];
    return (await res.json()) as ShingleProduct[];
  } catch {
    return [...DEFAULT_CATALOG];
  }
}

export async function pushCatalog(products: ShingleProduct[]): Promise<void> {
  await fetch("/api/catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(products),
  });
}

export async function resetCatalogRemote(): Promise<ShingleProduct[]> {
  await pushCatalog([...DEFAULT_CATALOG]);
  return [...DEFAULT_CATALOG];
}
