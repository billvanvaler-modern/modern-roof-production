export type VentilationType = "Ridge Vent" | "Box Vents" | "Box to Ridge Conversion";

export interface ShingleProduct {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  costPerBundle: number;
  bundlesPerSquare: number;
  includesPipeboots: boolean;
  includesWarranty: boolean;
  hipRidgeCostPerBundle: number;
  starterCostPerBundle: number;
  underlaymentCostPerRoll: number;
  iceWaterCostPerRoll: number;
  ridgeVentCostPer4ft: number;
  pipeJackCost: number;
  // Coverage rates — how much each unit covers
  hipRidgeLfPerBundle: number;    // linear feet per bundle (e.g. 31)
  starterLfPerBundle: number;     // linear feet per bundle (e.g. 114)
  underlaymentSqPerRoll: number;  // squares per roll (e.g. 10)
  iceWaterLfPerRoll: number;      // linear feet per roll (e.g. 66)
  sortOrder?: number;
}

export interface AuditRow {
  label: string;    // e.g. "Hip & Ridge bundles"
  formula: string;  // e.g. "282.84 lf ÷ 31 lf/bundle = 9.12 → ceil"
  result: string;   // e.g. "10 bundles"
}

export interface AuditGroup {
  title: string;
  rows: AuditRow[];
}

export interface ParsedMeasurements {
  customerName: string;
  address: string;
  // Roofr's pre-calculated squares at each waste % (e.g. { 0: 35.9, 10: 39.5, 11: 24.9, ... })
  wasteTable: Record<number, number>;
  // The waste % Roofr marks as "Recommended" in the report
  recommendedWastePct?: number;
  // Area (sqft) broken down by pitch — e.g. { "4/12": 2242, "8/12": 500 }
  pitchTable?: Record<string, number>;
  phone: string;
  email: string;
  totalAreaSqft: number;
  pitchedAreaSqft: number;
  flatAreaSqft: number;
  twoStoryAreaSqft: number;
  twoLayerAreaSqft: number;
  predominantPitch: string;
  eaves: number;
  valleys: number;
  hips: number;
  ridges: number;
  rakes: number;
  stepFlashing: number;
  wallFlashing: number;
}

export interface Measurements extends ParsedMeasurements {
  wastePct: number;
  squaresWithWaste: number;
}

export interface JobDetails {
  ventilation: VentilationType;
  boxVents: number;
  pipeJacks: number;
  furnaceVents: number;
  osbSheets: number;
  brickFlashing: boolean;
  chimneySmall: number;
  chimneyMedium: number;
  chimneyLarge: number;
  skylightReplace: number;
  skylightReFlash: number;
  cricketSmall: number;
  cricketMedium: number;
  cricketLarge: number;
  area4_12: number;
  area8_12: number;
  area10_12: number;
  area12_12: number;
  area2Story: number;
  area2Layers: number;
  osbLabor8_12: number;
  osbLabor10_12: number;
  osbLabor12_12: number;
  gutterFeet1st: number;
  downspouts1st: number;
  gutterFeet2nd: number;
  downspouts2nd: number;
  customOtherCost: number;
  customLaborCost: number;
}

export interface QuoteOptions {
  selectedProductIds: string[];
  pipeboots: boolean;
  warranty: boolean;
  gutters: boolean;
  gutterGuards: boolean;
  boxToRidge: boolean;
  profitMargin: number;
}

export interface MaterialLineItem {
  name: string;
  qty: number;
  unitCost: number;
  total: number;
}

export interface LaborLineItem {
  name: string;
  qty: number;
  rate: number;
  total: number;
}

export interface UpgradeBreakdown {
  pipeboots: number;
  warranty: number;
  gutters: number;
  gutterGuards: number;
  boxToRidge: number;
  total: number;
}

export interface QuoteResult {
  materialItems: MaterialLineItem[];
  materialSubtotal: number;
  materialWithTax: number;
  laborItems: LaborLineItem[];
  laborTotal: number;
  otherCost: number;
  totalCost: number;
  retailPrice: number;
  perSquarePrice: number;
  upgradeBreakdown: UpgradeBreakdown;
  totalWithUpgrades: number;
  commission: number;
  audit: AuditGroup[];
}

export interface WizardState {
  step: number;
  measurements: Measurements;
  jobDetails: JobDetails;
  options: QuoteOptions;
  quote: QuoteResult | null;
}
