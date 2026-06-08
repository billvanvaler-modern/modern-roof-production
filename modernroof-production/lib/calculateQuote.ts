import type {
  Measurements,
  JobDetails,
  QuoteOptions,
  QuoteResult,
  MaterialLineItem,
  LaborLineItem,
  ShingleProduct,
} from "./types";
import {
  HIP_RIDGE_LF_PER_BUNDLE,
  STARTER_LF_PER_BUNDLE,
  UNDERLAYMENT_SQ_PER_ROLL,
  ICE_WATER_LF_PER_ROLL,
  DRIP_EDGE_COST,
  GUTTER_APRON_COST,
  BOX_VENT_COST,
  QUARRIX_PLUG_COST,
  COIL_NAILS_COST,
  CAP_NAILS_COST,
  TRIM_COIL_COST,
  SEALANT_COST,
  STEP_FLASHING_COST,
  STEP_FLASHING_LF_PER_BUNDLE,
  OSB_COST,
  DELIVERY_COST,
  SILICONE_COST,
  FURNACE_VENT_COST,
  CRICKET_MATERIAL_COST,
  MATERIAL_TAX_RATE,
  LABOR,
  UPGRADE_PRICE,
  COMMISSION_RATE,
} from "./pricing";

function roundUp(value: number): number {
  return Math.ceil(value);
}

function line(name: string, qty: number, unitCost: number): MaterialLineItem {
  return { name, qty, unitCost, total: qty * unitCost };
}

function laborLine(name: string, qty: number, rate: number): LaborLineItem {
  return { name, qty, rate, total: qty * rate };
}

export function calculateQuote(
  measurements: Measurements,
  jobDetails: JobDetails,
  options: QuoteOptions,
  product: ShingleProduct
): QuoteResult {
  const { profitMargin } = options;
  const sq = measurements.squaresWithWaste;

  const { eaves, ridges, hips, rakes, valleys, stepFlashing, wallFlashing } =
    measurements;

  const {
    ventilation,
    boxVents,
    pipeJacks,
    furnaceVents,
    osbSheets,
    chimneySmall,
    chimneyMedium,
    chimneyLarge,
    skylightReplace,
    skylightReFlash,
    cricketSmall,
    cricketMedium,
    cricketLarge,
    area4_12,
    area8_12,
    area10_12,
    area12_12,
    area2Story,
    area2Layers,
    osbLabor8_12,
    osbLabor10_12,
    osbLabor12_12,
    gutterFeet1st,
    gutterFeet2nd,
    customOtherCost,
    customLaborCost,
  } = jobDetails;

  // ─── Material Quantities ───────────────────────────────────────────────────

  const shingleBundles = roundUp(sq * product.bundlesPerSquare);
  const hipRidgeBundles = roundUp((ridges + hips) / HIP_RIDGE_LF_PER_BUNDLE);
  const starterBundles = roundUp((rakes + eaves) / STARTER_LF_PER_BUNDLE);
  const underlaymentRolls = roundUp(
    (sq + area4_12) / UNDERLAYMENT_SQ_PER_ROLL
  );
  const dripEdgePieces = roundUp(rakes / 10 + 2);
  const gutterApronPieces = roundUp(eaves / 10 + 2);
  const iceWaterRolls = roundUp(
    (valleys + eaves + wallFlashing + stepFlashing) / ICE_WATER_LF_PER_ROLL
  );

  const ridgeVentPieces =
    ventilation === "Ridge Vent" ? roundUp((ridges - 4) / 4) : 0;
  const boxVentCount = ventilation === "Box Vents" ? boxVents : 0;
  const quarrixPlugs =
    ventilation === "Box to Ridge Conversion" ? boxVents : 0;

  const coilNailBoxes = roundUp(sq / 17);
  const capNailBoxes = roundUp(sq / 17);
  const trimCoilRolls = chimneySmall + chimneyMedium + chimneyLarge;
  const sealantTubes = chimneySmall + chimneyMedium + chimneyLarge;
  const stepFlashingBundles = roundUp(
    stepFlashing / STEP_FLASHING_LF_PER_BUNDLE
  );

  // ─── Material Costs ────────────────────────────────────────────────────────

  const materialItems: MaterialLineItem[] = [
    line("Shingles", shingleBundles, product.costPerBundle),
    line("Hip & Ridge", hipRidgeBundles, product.hipRidgeCostPerBundle),
    line("Starter", starterBundles, product.starterCostPerBundle),
    line("Underlayment", underlaymentRolls, product.underlaymentCostPerRoll),
    line("Drip Edge (10')", dripEdgePieces, DRIP_EDGE_COST),
    line("Gutter Apron (10')", gutterApronPieces, GUTTER_APRON_COST),
    line("Ice & Water Shield", iceWaterRolls, product.iceWaterCostPerRoll),
  ];

  if (ventilation === "Ridge Vent" && ridgeVentPieces > 0) {
    materialItems.push(
      line("Ridge Vent (4')", ridgeVentPieces, product.ridgeVentCostPer4ft)
    );
  }
  if (boxVentCount > 0) {
    materialItems.push(line("Box Vents", boxVentCount, BOX_VENT_COST));
  }
  if (quarrixPlugs > 0) {
    materialItems.push(line("Quarrix Plugs", quarrixPlugs, QUARRIX_PLUG_COST));
  }
  if (pipeJacks > 0) {
    materialItems.push(line("Pipe Jacks", pipeJacks, product.pipeJackCost));
  }

  materialItems.push(
    line("Coil Nails", coilNailBoxes, COIL_NAILS_COST),
    line("Cap Nails", capNailBoxes, CAP_NAILS_COST)
  );

  if (trimCoilRolls > 0) {
    materialItems.push(line("Trim Coil", trimCoilRolls, TRIM_COIL_COST));
    materialItems.push(line("Sealant", sealantTubes, SEALANT_COST));
  }
  if (stepFlashingBundles > 0) {
    materialItems.push(
      line("Step Flashing", stepFlashingBundles, STEP_FLASHING_COST)
    );
  }
  if (osbSheets > 0) {
    materialItems.push(line("OSB Sheathing", osbSheets, OSB_COST));
  }

  materialItems.push(line("Delivery", 1, DELIVERY_COST));
  materialItems.push(line("Silicone", 2, SILICONE_COST));

  if (furnaceVents > 0) {
    materialItems.push(
      line("Furnace Vent Flashing", furnaceVents, FURNACE_VENT_COST)
    );
  }

  const totalCrickets = cricketSmall + cricketMedium + cricketLarge;
  if (totalCrickets > 0) {
    materialItems.push(
      line("Cricket Material", totalCrickets, CRICKET_MATERIAL_COST)
    );
  }

  const materialSubtotal = materialItems.reduce((s, i) => s + i.total, 0);
  const otherCost = customOtherCost;
  const materialWithTax =
    (materialSubtotal + otherCost) * (1 + MATERIAL_TAX_RATE);

  // ─── Labor ────────────────────────────────────────────────────────────────

  const laborItems: LaborLineItem[] = [
    laborLine("Remove & Replace", sq, LABOR.removeReplace),
    laborLine("Starter Bundle Labor", starterBundles, LABOR.starterBundle),
  ];

  if (area2Story > 0)
    laborItems.push(laborLine("2-Story", area2Story, LABOR.twoStory));
  if (area8_12 > 0)
    laborItems.push(laborLine("Pitch 8/12–9/12", area8_12, LABOR.pitch_8_12));
  if (area10_12 > 0)
    laborItems.push(
      laborLine("Pitch 10/12–11/12", area10_12, LABOR.pitch_10_12)
    );
  if (area12_12 > 0)
    laborItems.push(laborLine("Pitch 12/12+", area12_12, LABOR.pitch_12_12));
  if (area2Layers > 0)
    laborItems.push(laborLine("2 Layers", area2Layers, LABOR.twoLayers));
  if (area4_12 > 0)
    laborItems.push(
      laborLine("Double Felt (4/12 or less)", area4_12, LABOR.doubleFelt)
    );
  if (stepFlashing > 0)
    laborItems.push(
      laborLine("Step Flashing", stepFlashing, LABOR.stepFlashing)
    );

  laborItems.push(laborLine("Trip Charge", 1, LABOR.tripCharge));

  if (chimneySmall > 0)
    laborItems.push(
      laborLine("Chimney Flashing (Small)", chimneySmall, LABOR.chimneySmall)
    );
  if (chimneyMedium > 0)
    laborItems.push(
      laborLine(
        "Chimney Flashing (Medium)",
        chimneyMedium,
        LABOR.chimneyMedium
      )
    );
  if (chimneyLarge > 0)
    laborItems.push(
      laborLine("Chimney Flashing (Large)", chimneyLarge, LABOR.chimneyLarge)
    );
  if (cricketSmall > 0)
    laborItems.push(
      laborLine("Build Cricket (Small)", cricketSmall, LABOR.cricketSmall)
    );
  if (cricketMedium > 0)
    laborItems.push(
      laborLine(
        "Build Cricket (Medium)",
        cricketMedium,
        LABOR.cricketMedium
      )
    );
  if (cricketLarge > 0)
    laborItems.push(
      laborLine("Build Cricket (Large)", cricketLarge, LABOR.cricketLarge)
    );
  if (skylightReplace > 0)
    laborItems.push(
      laborLine("Skylight Replace", skylightReplace, LABOR.skylightReplace)
    );
  if (skylightReFlash > 0)
    laborItems.push(
      laborLine("Skylight Re-Flash", skylightReFlash, LABOR.skylightReFlash)
    );
  if (osbLabor8_12 > 0)
    laborItems.push(
      laborLine("OSB Labor (up to 9/12)", osbLabor8_12, LABOR.osbUpTo9_12)
    );
  if (osbLabor10_12 > 0)
    laborItems.push(
      laborLine("OSB Labor (10/12–11/12)", osbLabor10_12, LABOR.osb10_12)
    );
  if (osbLabor12_12 > 0)
    laborItems.push(
      laborLine("OSB Labor (12/12+)", osbLabor12_12, LABOR.osb12_12)
    );
  if ((customLaborCost ?? 0) > 0)
    laborItems.push(
      laborLine("Extra Labor", 1, customLaborCost ?? 0)
    );

  const laborTotal = laborItems.reduce((s, i) => s + i.total, 0);

  // ─── Base Quote ───────────────────────────────────────────────────────────

  const totalCost = materialWithTax + laborTotal;
  const retailPrice = totalCost / (1 - profitMargin);
  const perSquarePrice = sq > 0 ? retailPrice / sq : 0;

  // ─── Upgrades ─────────────────────────────────────────────────────────────

  const totalGutterFeet = gutterFeet1st + gutterFeet2nd;

  const pipebootsPrice =
    !product.includesPipeboots && options.pipeboots
      ? pipeJacks * UPGRADE_PRICE.pipeboots
      : 0;

  const warrantyPrice =
    !product.includesWarranty && options.warranty
      ? sq * UPGRADE_PRICE.warrantyPerSq
      : 0;

  const guttersPrice = options.gutters
    ? totalGutterFeet * UPGRADE_PRICE.guttersPerFt
    : 0;

  const gutterGuardsPrice = options.gutterGuards
    ? totalGutterFeet * UPGRADE_PRICE.gutterGuardsPerFt
    : 0;

  const boxToRidgePrice = options.boxToRidge
    ? ridges * UPGRADE_PRICE.newRidgePerFt + boxVents * UPGRADE_PRICE.plugOldBox
    : 0;

  const upgradeTotal =
    pipebootsPrice +
    warrantyPrice +
    guttersPrice +
    gutterGuardsPrice +
    boxToRidgePrice;

  const totalWithUpgrades = retailPrice + upgradeTotal;
  const commission = COMMISSION_RATE * totalWithUpgrades;

  return {
    materialItems,
    materialSubtotal,
    materialWithTax,
    laborItems,
    laborTotal,
    otherCost,
    totalCost,
    retailPrice,
    perSquarePrice,
    upgradeBreakdown: {
      pipeboots: pipebootsPrice,
      warranty: warrantyPrice,
      gutters: guttersPrice,
      gutterGuards: gutterGuardsPrice,
      boxToRidge: boxToRidgePrice,
      total: upgradeTotal,
    },
    totalWithUpgrades,
    commission,
  };
}
