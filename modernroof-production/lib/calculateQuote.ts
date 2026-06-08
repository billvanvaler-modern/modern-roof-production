import type {
  Measurements,
  JobDetails,
  QuoteOptions,
  QuoteResult,
  MaterialLineItem,
  LaborLineItem,
  ShingleProduct,
  AuditGroup,
  AuditRow,
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

/** Format a plain number — show integers as integers, decimals to 2 dp (trim trailing zeros) */
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

/** Format as currency — always 2 decimal places with $ prefix */
function fmtM(n: number): string {
  return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Build a single AuditRow */
function row(label: string, formula: string, result: string): AuditRow {
  return { label, formula, result };
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

  // ─── Coverage rates (per-product, fallback to global defaults) ────────────

  const hipRidgeLfPerBundle = product.hipRidgeLfPerBundle ?? HIP_RIDGE_LF_PER_BUNDLE;
  const starterLfPerBundle = product.starterLfPerBundle ?? STARTER_LF_PER_BUNDLE;
  const underlaymentSqPerRoll = product.underlaymentSqPerRoll ?? UNDERLAYMENT_SQ_PER_ROLL;
  const iceWaterLfPerRoll = product.iceWaterLfPerRoll ?? ICE_WATER_LF_PER_ROLL;

  // ─── Material Quantities ───────────────────────────────────────────────────

  const shingleBundles = roundUp(sq * product.bundlesPerSquare);
  const hipRidgeBundles = roundUp((ridges + hips) / hipRidgeLfPerBundle);
  const starterBundles = roundUp((rakes + eaves) / starterLfPerBundle);
  const underlaymentRolls = roundUp((sq + area4_12) / underlaymentSqPerRoll);
  const dripEdgePieces = roundUp(rakes / 10 + 2);
  const gutterApronPieces = roundUp(eaves / 10 + 2);
  const iceWaterRolls = roundUp(
    (valleys + eaves + wallFlashing + stepFlashing) / iceWaterLfPerRoll
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

  // ─── Full Calculation Audit ───────────────────────────────────────────────

  const inputRows: AuditRow[] = [
    row("Squares with waste", `${fmt(measurements.squaresWithWaste)} sq (waste % applied)`, `${fmt(sq)} sq`),
    row("Eaves", "from Roofr report", `${fmt(eaves)} lf`),
    row("Rakes", "from Roofr report", `${fmt(rakes)} lf`),
    row("Ridges", "from Roofr report", `${fmt(ridges)} lf`),
    row("Hips", "from Roofr report", `${fmt(hips)} lf`),
    row("Valleys", "from Roofr report", `${fmt(valleys)} lf`),
  ];
  if (stepFlashing > 0)
    inputRows.push(row("Step Flashing", "from Roofr report", `${fmt(stepFlashing)} lf`));
  if (wallFlashing > 0)
    inputRows.push(row("Wall Flashing", "from Roofr report", `${fmt(wallFlashing)} lf`));
  if (area4_12 > 0)
    inputRows.push(row("Area ≤4/12 pitch", "job details", `${fmt(area4_12)} sq`));
  if (area8_12 > 0)
    inputRows.push(row("Area 8/12–9/12", "job details", `${fmt(area8_12)} sq`));
  if (area10_12 > 0)
    inputRows.push(row("Area 10/12–11/12", "job details", `${fmt(area10_12)} sq`));
  if (area12_12 > 0)
    inputRows.push(row("Area 12/12+", "job details", `${fmt(area12_12)} sq`));
  if (area2Story > 0)
    inputRows.push(row("2-Story area", "job details", `${fmt(area2Story)} sq`));
  if (area2Layers > 0)
    inputRows.push(row("2-Layer tear-off area", "job details", `${fmt(area2Layers)} sq`));
  if (pipeJacks > 0)
    inputRows.push(row("Pipe jacks", "job details", `${pipeJacks}`));
  if (boxVents > 0)
    inputRows.push(row("Box vents", "job details", `${boxVents}`));
  if (osbSheets > 0)
    inputRows.push(row("OSB sheets", "job details", `${osbSheets}`));
  if (chimneySmall + chimneyMedium + chimneyLarge > 0)
    inputRows.push(row("Chimneys", "job details", `${chimneySmall} small, ${chimneyMedium} medium, ${chimneyLarge} large`));
  if (skylightReplace + skylightReFlash > 0)
    inputRows.push(row("Skylights", "job details", `${skylightReplace} replace, ${skylightReFlash} re-flash`));
  inputRows.push(row("Product", product.manufacturer, product.name));
  inputRows.push(row("Profit margin", "quote settings", `${(profitMargin * 100).toFixed(0)}%`));

  const qtyRows: AuditRow[] = [
    row(
      "Shingles",
      `${fmt(sq)} sq × ${product.bundlesPerSquare} bundles/sq = ${fmt(sq * product.bundlesPerSquare)} → ceil`,
      `${shingleBundles} bundles`
    ),
    row(
      "Hip & Ridge",
      `(${fmt(hips)} hips + ${fmt(ridges)} ridges) = ${fmt(hips + ridges)} lf ÷ ${hipRidgeLfPerBundle} lf/bundle = ${fmt((hips + ridges) / hipRidgeLfPerBundle)} → ceil`,
      `${hipRidgeBundles} bundles`
    ),
    row(
      "Starter",
      `(${fmt(eaves)} eaves + ${fmt(rakes)} rakes) = ${fmt(eaves + rakes)} lf ÷ ${starterLfPerBundle} lf/bundle = ${fmt((eaves + rakes) / starterLfPerBundle)} → ceil`,
      `${starterBundles} bundles`
    ),
    row(
      "Underlayment",
      `(${fmt(sq)} sq + ${fmt(area4_12)} double-felt sq) = ${fmt(sq + area4_12)} sq ÷ ${underlaymentSqPerRoll} sq/roll = ${fmt((sq + area4_12) / underlaymentSqPerRoll)} → ceil`,
      `${underlaymentRolls} rolls`
    ),
    row(
      "Ice & Water Shield",
      `(${fmt(valleys)} valleys + ${fmt(eaves)} eaves + ${fmt(wallFlashing)} wall + ${fmt(stepFlashing)} step) = ${fmt(valleys + eaves + wallFlashing + stepFlashing)} lf ÷ ${iceWaterLfPerRoll} lf/roll = ${fmt((valleys + eaves + wallFlashing + stepFlashing) / iceWaterLfPerRoll)} → ceil`,
      `${iceWaterRolls} rolls`
    ),
    row(
      "Drip Edge (10' pieces)",
      `${fmt(rakes)} rakes ÷ 10 + 2 buffer = ${fmt(rakes / 10 + 2)} → ceil`,
      `${dripEdgePieces} pieces`
    ),
    row(
      "Gutter Apron (10' pieces)",
      `${fmt(eaves)} eaves ÷ 10 + 2 buffer = ${fmt(eaves / 10 + 2)} → ceil`,
      `${gutterApronPieces} pieces`
    ),
    row(
      "Coil Nails",
      `${fmt(sq)} sq ÷ 17 sq/box = ${fmt(sq / 17)} → ceil`,
      `${coilNailBoxes} boxes`
    ),
    row(
      "Cap Nails",
      `${fmt(sq)} sq ÷ 17 sq/box = ${fmt(sq / 17)} → ceil`,
      `${capNailBoxes} boxes`
    ),
  ];

  if (ventilation === "Ridge Vent") {
    qtyRows.push(row(
      "Ridge Vent (4' pieces)",
      `(${fmt(ridges)} ridges − 4 ft) ÷ 4 ft/piece = ${fmt((ridges - 4) / 4)} → ceil`,
      `${ridgeVentPieces} pieces`
    ));
  } else if (ventilation === "Box Vents") {
    qtyRows.push(row("Box Vents", "from job details", `${boxVentCount} vents`));
  } else if (ventilation === "Box to Ridge Conversion") {
    qtyRows.push(row("Quarrix Plugs (box-to-ridge)", "1 plug per existing box vent", `${quarrixPlugs} plugs`));
  }

  if (pipeJacks > 0)
    qtyRows.push(row("Pipe Jacks", "from job details", `${pipeJacks} jacks`));
  if (trimCoilRolls > 0) {
    qtyRows.push(row("Trim Coil", `${chimneySmall} small + ${chimneyMedium} medium + ${chimneyLarge} large chimneys`, `${trimCoilRolls} rolls`));
    qtyRows.push(row("Sealant", `1 tube per chimney = ${trimCoilRolls} chimneys`, `${sealantTubes} tubes`));
  }
  if (stepFlashingBundles > 0)
    qtyRows.push(row(
      "Step Flashing",
      `${fmt(stepFlashing)} lf ÷ ${STEP_FLASHING_LF_PER_BUNDLE} lf/bundle = ${fmt(stepFlashing / STEP_FLASHING_LF_PER_BUNDLE)} → ceil`,
      `${stepFlashingBundles} bundles`
    ));
  if (osbSheets > 0)
    qtyRows.push(row("OSB Sheathing", "from job details", `${osbSheets} sheets`));
  if (furnaceVents > 0)
    qtyRows.push(row("Furnace Vent Flashing", "from job details", `${furnaceVents} vents`));
  if (totalCrickets > 0)
    qtyRows.push(row("Cricket Material", `${cricketSmall} small + ${cricketMedium} medium + ${cricketLarge} large`, `${totalCrickets} crickets`));
  qtyRows.push(row("Delivery", "flat rate", "1"));
  qtyRows.push(row("Silicone", "standard 2 tubes", "2 tubes"));

  const costRows: AuditRow[] = materialItems.map((item) =>
    row(item.name, `${item.qty} × ${fmtM(item.unitCost)}`, fmtM(item.total))
  );
  costRows.push(row("Material Subtotal", "", fmtM(materialSubtotal)));
  if (otherCost > 0)
    costRows.push(row("Extra Material Costs", "no tax applied yet", fmtM(otherCost)));
  costRows.push(row(
    "Sales Tax (7%)",
    `(${fmtM(materialSubtotal)} + ${fmtM(otherCost)}) × ${(MATERIAL_TAX_RATE * 100).toFixed(0)}%`,
    fmtM((materialSubtotal + otherCost) * MATERIAL_TAX_RATE)
  ));
  costRows.push(row("Materials Total (with tax)", "", fmtM(materialWithTax)));

  const laborRows: AuditRow[] = laborItems.map((item) =>
    row(
      item.name,
      item.qty === 1
        ? `flat rate`
        : `${fmt(item.qty)} × ${fmtM(item.rate)}`,
      fmtM(item.total)
    )
  );
  laborRows.push(row("Labor Total", "", fmtM(laborTotal)));

  const pricingRows: AuditRow[] = [
    row("Materials (with tax)", "", fmtM(materialWithTax)),
    row("Labor", "", fmtM(laborTotal)),
    row("Total Cost", `${fmtM(materialWithTax)} + ${fmtM(laborTotal)}`, fmtM(totalCost)),
    row(
      "Retail Price",
      `${fmtM(totalCost)} ÷ (1 − ${(profitMargin * 100).toFixed(0)}% margin)`,
      fmtM(retailPrice)
    ),
    row(
      "Price per Square",
      `${fmtM(retailPrice)} ÷ ${fmt(sq)} sq`,
      fmtM(perSquarePrice)
    ),
  ];
  if (upgradeTotal > 0) {
    if (pipebootsPrice > 0)
      pricingRows.push(row("Upgrade: Pipeboots", `${pipeJacks} × ${fmtM(UPGRADE_PRICE.pipeboots)}`, fmtM(pipebootsPrice)));
    if (warrantyPrice > 0)
      pricingRows.push(row("Upgrade: Warranty", `${fmt(sq)} sq × ${fmtM(UPGRADE_PRICE.warrantyPerSq)}/sq`, fmtM(warrantyPrice)));
    if (guttersPrice > 0)
      pricingRows.push(row("Upgrade: Gutters", `${totalGutterFeet} lf × ${fmtM(UPGRADE_PRICE.guttersPerFt)}/lf`, fmtM(guttersPrice)));
    if (gutterGuardsPrice > 0)
      pricingRows.push(row("Upgrade: Gutter Guards", `${totalGutterFeet} lf × ${fmtM(UPGRADE_PRICE.gutterGuardsPerFt)}/lf`, fmtM(gutterGuardsPrice)));
    if (boxToRidgePrice > 0)
      pricingRows.push(row(
        "Upgrade: Box-to-Ridge",
        `${fmt(ridges)} lf × ${fmtM(UPGRADE_PRICE.newRidgePerFt)} + ${boxVents} plugs × ${fmtM(UPGRADE_PRICE.plugOldBox)}`,
        fmtM(boxToRidgePrice)
      ));
    pricingRows.push(row("Total with Upgrades", `${fmtM(retailPrice)} + ${fmtM(upgradeTotal)}`, fmtM(totalWithUpgrades)));
  }
  pricingRows.push(row(
    "Commission",
    `${fmtM(totalWithUpgrades)} × ${(COMMISSION_RATE * 100).toFixed(0)}%`,
    fmtM(commission)
  ));

  const audit: AuditGroup[] = [
    { title: "Inputs from Roofr Report", rows: inputRows },
    { title: "Material Quantities", rows: qtyRows },
    { title: "Material Costs", rows: costRows },
    { title: "Labor", rows: laborRows },
    { title: "Pricing", rows: pricingRows },
  ];

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
    audit,
  };
}
