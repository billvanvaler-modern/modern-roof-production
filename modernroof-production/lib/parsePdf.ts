import type { ParsedMeasurements } from "./types";

export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
}

/**
 * Uses PDF text item X coordinates to find which waste % column the
 * "Recommended" header sits above. Called from the API route after
 * collecting items via the custom pagerender.
 */
export function findRecommendedWastePct(
  items: PdfTextItem[],
  wasteTable: Record<number, number>
): number | undefined {
  const recItem = items.find((it) => /^recommended$/i.test(it.str.trim()));
  if (!recItem) return undefined;

  const recCenterX = recItem.x + recItem.width / 2;

  // Find all waste-table percentage text items (e.g. "11%")
  const pctItems = items.filter((it) => {
    const m = it.str.trim().match(/^(\d+)%$/);
    if (!m) return false;
    return wasteTable[parseInt(m[1], 10)] !== undefined;
  });

  if (pctItems.length === 0) return undefined;

  // Return the percentage whose center-x is closest to Recommended's center-x
  let best: PdfTextItem | null = null;
  let minDist = Infinity;
  for (const item of pctItems) {
    const cx = item.x + item.width / 2;
    const dist = Math.abs(cx - recCenterX);
    if (dist < minDist) { minDist = dist; best = item; }
  }

  if (!best) return undefined;
  const pct = parseInt(best.str.trim(), 10);
  return wasteTable[pct] !== undefined ? pct : undefined;
}

function parseFtIn(ftStr: string, inStr: string): number {
  const ft = parseInt(ftStr, 10) || 0;
  const inches = parseInt(inStr, 10) || 0;
  return ft + inches / 12;
}

// Matches "Total X: 3589 sqft" or "Total X3589 sqft" (Roofr omits space/colon in report summary)
function extractSqft(text: string, label: string): number {
  const re = new RegExp(label + "\\s*:?\\s*([\\d,]+)\\s*sqft", "i");
  const m = text.match(re);
  if (!m) return 0;
  return parseInt(m[1].replace(/,/g, ""), 10);
}

// Matches "Total eaves315ft 6in" or "Total eaves: 315ft 6in" or "Eaves: 315ft 6in"
function extractFtIn(text: string, label: string): number {
  const re = new RegExp(label + "\\s*:?\\s*(\\d+)ft\\s*(\\d+)in", "i");
  const m = text.match(re);
  if (!m) return 0;
  return parseFtIn(m[1], m[2]);
}

export function parseRoofrText(text: string): ParsedMeasurements {
  // ─── Customer info ────────────────────────────────────────────────────────
  // Email and phone are the most reliable fields
  const emailMatch = text.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1] : "";

  const phoneMatch = text.match(/\b(\d{10})\b/);
  const phone = phoneMatch ? phoneMatch[1] : "";

  // Address: look for it after known section headers where it's cleanly on its own line.
  // In Roofr PDFs the address repeats cleanly after "Report summary\n" and "Diagram\n".
  let address = "";
  const addrPattern = /(\d+\s+[A-Za-z][A-Za-z0-9 .]+,\s*[A-Za-z ]+,\s*[A-Z]{2}\s+\d{5})/g;
  const candidates: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = addrPattern.exec(text)) !== null) {
    candidates.push(m[1].trim());
  }
  // Pick the shortest candidate (avoids the "127772" prefix from pitch-address concatenation)
  if (candidates.length > 0) {
    address = candidates.reduce((a, b) => (a.length <= b.length ? a : b));
  }

  // Customer name: the line immediately before the email address on page 1
  let customerName = "";
  if (email) {
    // Look for a name-like line (letters, spaces, periods, hyphens) directly before the email
    const nameMatch = text.match(/([A-Za-z][A-Za-z .'`-]{2,})\n[a-zA-Z0-9._%+\-]+@/);
    if (nameMatch) customerName = nameMatch[1].trim();
  }

  // ─── Predominant pitch ────────────────────────────────────────────────────
  // Limit denominator to 1-2 digits to avoid "5/127772" from page-1 concatenation
  const pitchMatch = text.match(/Predominant pitch\s*:?\s*(\d+\/\d{1,2})(?!\d)/i);
  const predominantPitch = pitchMatch ? pitchMatch[1] : "";

  // ─── Areas ────────────────────────────────────────────────────────────────
  const totalAreaSqft = extractSqft(text, "Total roof area");
  const pitchedAreaSqft = extractSqft(text, "Total pitched area");
  const flatAreaSqft = extractSqft(text, "Total flat area");

  const twoStoryMatch = text.match(/Two story area\s*:?\s*([\d,]+)\s*sqft/i);
  const twoStoryAreaSqft = twoStoryMatch
    ? parseInt(twoStoryMatch[1].replace(/,/g, ""), 10)
    : 0;

  const twoLayerMatch = text.match(/Two layer area\s*:?\s*([\d,]+)\s*sqft/i);
  const twoLayerAreaSqft = twoLayerMatch
    ? parseInt(twoLayerMatch[1].replace(/,/g, ""), 10)
    : 0;

  // ─── Linear measurements ──────────────────────────────────────────────────
  // Try "Total X" form first (report summary), fall back to "X:" form (length page)
  const eaves =
    extractFtIn(text, "Total eaves") || extractFtIn(text, "Eaves:");
  const valleys =
    extractFtIn(text, "Total valleys") || extractFtIn(text, "Valleys:");
  const hips =
    extractFtIn(text, "Total hips") || extractFtIn(text, "Hips:");
  const ridges =
    extractFtIn(text, "Total ridges") || extractFtIn(text, "Ridges:");
  const rakes =
    extractFtIn(text, "Total rakes") || extractFtIn(text, "Rakes:");
  const stepFlashing =
    extractFtIn(text, "Total step flashing") ||
    extractFtIn(text, "Step flashing:");
  const wallFlashing =
    extractFtIn(text, "Total wall flashing") ||
    extractFtIn(text, "Wall flashing:");

  // ─── Pitch area table ────────────────────────────────────────────────────
  // Roofr's pitch table appears before the waste table:
  //   "Pitch4/12\nArea (sqft)2,242\nSquares22.5"  (single pitch)
  //   "Pitch4/128/12\nArea (sqft)1,0001,500\n..."  (multiple pitches concatenated)
  // Use \nPitch to avoid matching "Predominant pitch" on a different line.
  const pitchTable: Record<string, number> = {};
  const pitchTableMatch = text.match(/\nPitch((?:\s*\d+\/\d+)+)\nArea\s*\(sqft\)\s*((?:[\d,]+\s*)+)/i);
  if (pitchTableMatch) {
    const pitches = pitchTableMatch[1].match(/\d+\/\d+/g) || [];
    const areas = pitchTableMatch[2].match(/[\d,]+/g) || [];
    pitches.forEach((pitch, i) => {
      if (areas[i] !== undefined) {
        pitchTable[pitch] = parseInt(areas[i].replace(/,/g, ""), 10);
      }
    });
  }

  // ─── Waste table + recommended % from Roofr ─────────────────────────────
  // The report summary has two "Squares" lines:
  //   1. "Squares35.9"  (standalone base value)
  //   2. "Squares35.939.239.540.241.342.043.1"  (the waste table row, after "Waste %")
  // We must parse within the section that starts at "Waste %".
  const wasteTable: Record<number, number> = {};
  let recommendedWastePct: number | undefined;
  const wasteIdx = text.search(/Waste\s*%/i);
  if (wasteIdx !== -1) {
    const afterWaste = text.slice(wasteIdx);
    const wastePctLine = afterWaste.match(/Waste\s*%\s*((?:\d+%\s*)+)/i);
    const squaresLine = afterWaste.match(/Squares\s*([\d.]+)/);
    if (wastePctLine && squaresLine) {
      const pcts = (wastePctLine[1].match(/\d+/g) || []).map(Number);
      const sqs = (squaresLine[1].match(/\d+\.\d/g) || []).map(Number);
      pcts.forEach((pct, i) => {
        if (sqs[i] !== undefined) wasteTable[pct] = sqs[i];
      });
    }

    // Detect which % Roofr marks as "Recommended":
    // Try "11%Recommended" / "11% Recommended" first, then "Recommended11%" / "Recommended 11%"
    const recAfter = afterWaste.match(/(\d+)%\s*Recommended/i);
    const recBefore = afterWaste.match(/Recommended\s*(\d+)%/i);
    const recRaw = recAfter ?? recBefore;
    if (recRaw) {
      const candidate = parseInt(recRaw[1], 10);
      if (wasteTable[candidate] !== undefined) {
        recommendedWastePct = candidate;
      }
    }
  }

  return {
    customerName,
    address,
    phone,
    email,
    wasteTable,
    recommendedWastePct,
    pitchTable,
    totalAreaSqft,
    pitchedAreaSqft,
    flatAreaSqft,
    twoStoryAreaSqft,
    twoLayerAreaSqft,
    predominantPitch,
    eaves: Math.round(eaves * 100) / 100,
    valleys: Math.round(valleys * 100) / 100,
    hips: Math.round(hips * 100) / 100,
    ridges: Math.round(ridges * 100) / 100,
    rakes: Math.round(rakes * 100) / 100,
    stepFlashing: Math.round(stepFlashing * 100) / 100,
    wallFlashing: Math.round(wallFlashing * 100) / 100,
  };
}
