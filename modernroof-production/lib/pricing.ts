// Hip & Ridge: lf per bundle
export const HIP_RIDGE_LF_PER_BUNDLE = 31;

export const STARTER_LF_PER_BUNDLE = 114;
export const UNDERLAYMENT_SQ_PER_ROLL = 10;
export const ICE_WATER_LF_PER_ROLL = 66;

// Fixed costs (same for all shingles)
export const DRIP_EDGE_COST = 7.8; // per 10' piece
export const GUTTER_APRON_COST = 8.3; // per 10' piece
export const BOX_VENT_COST = 18.5; // each
export const QUARRIX_PLUG_COST = 17.7; // each (for box-to-ridge conversion)
export const COIL_NAILS_COST = 54.0; // per box; 1 box per 17 squares
export const CAP_NAILS_COST = 17.0; // per box; 1 box per 17 squares
export const TRIM_COIL_COST = 108.5; // per roll; 1 per chimney
export const SEALANT_COST = 8.59; // per tube; 1 per chimney
export const STEP_FLASHING_COST = 73.5; // per bundle; covers 50 lf
export const STEP_FLASHING_LF_PER_BUNDLE = 50;
export const OSB_COST = 24.95; // per sheet
export const DELIVERY_COST = 65.0; // fixed
export const SILICONE_COST = 8.49; // per tube (2 fixed)
export const FURNACE_VENT_COST = 75.0; // each
export const CRICKET_MATERIAL_COST = 85.0; // each

// Tax rate on all materials
export const MATERIAL_TAX_RATE = 0.07;

// Labor rates
export const LABOR = {
  removeReplace: 80.0, // per square
  starterBundle: 80.0, // per bundle
  twoStory: 15.0, // per square
  pitch_8_12: 15.0, // per square
  pitch_10_12: 20.0, // per square
  pitch_12_12: 25.0, // per square
  twoLayers: 10.0, // per square
  doubleFelt: 10.0, // per square (4/12 or less)
  stepFlashing: 2.0, // per lf
  tripCharge: 100.0, // fixed
  chimneySmall: 150.0,
  chimneyMedium: 200.0,
  chimneyLarge: 250.0,
  cricketSmall: 100.0,
  cricketMedium: 200.0,
  cricketLarge: 300.0,
  skylightReplace: 150.0,
  skylightReFlash: 75.0,
  osbUpTo9_12: 10.0, // per sheet
  osb10_12: 15.0, // per sheet
  osb12_12: 25.0, // per sheet
};

// Upgrade pricing (what to charge the customer)
export const UPGRADE_PRICE = {
  pipeboots: 149.0,        // per pipe jack (lifetime tool)
  warrantyPerSq: 35.0,     // Emerald Pro — per square
  guttersPerFt: 12.0,      // per linear foot of gutter/guard
  gutterGuardsPerFt: 12.0, // per linear foot of gutter guard
  // Downspouts add equivalent gutter footage for pricing purposes.
  // 1-story downspout ≈ 13 lf; 2-story downspout ≈ 23 lf.
  // Adjust these values in this file whenever material/labor costs change.
  downspout1stFt: 13,      // equivalent lf added per 1-story downspout
  downspout2ndFt: 23,      // equivalent lf added per 2-story downspout
  newRidgePerFt: 13.5,     // for box-to-ridge conversion
  plugOldBox: 21.0,        // per box vent plugged
};

// Upgrade costs (what the contractor pays)
export const UPGRADE_COST = {
  pipeboots: 60.0, // per pipe jack
  warrantyPerSq: 12.0, // Emerald Pro
  guttersPerFt: 6.5, // install cost per lf
  gutterGuardsPerFt: 6.5, // per lf
  gutters2ndStoryPerFt: 0.5, // extra for 2nd story
  gutterMinimum: 450.0,
  newRidgePerFt: 7.5,
  plugOldBox: 18.0,
};

// Commission rate
export const COMMISSION_RATE = 0.08;

export const WASTE_OPTIONS = [0, 9, 10, 12, 15, 17, 20];
