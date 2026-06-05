"use client";

import { useState } from "react";
import type { QuoteResult, Measurements, QuoteOptions, ShingleProduct } from "@/lib/types";

export interface ProductQuote {
  product: ShingleProduct;
  result: QuoteResult;
}

interface Props {
  measurements: Measurements;
  options: QuoteOptions;
  quotes: ProductQuote[];
  onBack: () => void;
  onReset: () => void;
  onSendToProduction?: () => void;
  sending?: boolean;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const fmtDec = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const STANDARD_INCLUSIONS = [
  "Remove existing shingle roof down the deck",
  "Inspect roof deck for damage, rot or signs of moisture",
  "Install Ice and Water Shield along all eaves, valleys and flashing points",
  "Install new Synthetic Underlayment on entire roof deck",
  "Install new Drip Edge & Gutter Apron along eaves and rakes",
  "Install new field shingles, starter shingles & hip and ridge shingles",
  "Install new Pipe Flashings",
  "Install new Step Flashing",
  "Clean up work area and ensure nails are picked up using magnets in yard and driveway",
];

export default function Step5Quote({ measurements, options, quotes, onBack, onReset, onSendToProduction, sending }: Props) {
  const [expanded, setExpanded] = useState<string | null>(
    quotes.length === 1 ? quotes[0].product.id : null
  );

  const hasUpgrades = quotes.some((q) => q.result.upgradeBreakdown.total > 0);

  // Collect upgrade add-ons that are selected and have a price in at least one quote
  const firstQ = quotes[0]?.result;
  const upgradeLines: { name: string; price: number }[] = [];
  if (firstQ) {
    if (options.pipeboots && firstQ.upgradeBreakdown.pipeboots > 0)
      upgradeLines.push({ name: "Lifetime Pipeboots", price: firstQ.upgradeBreakdown.pipeboots });
    // For warranty/gutters/etc., fall back to any quote that has a non-zero cost
    const warrantyPrice = quotes.find((q) => q.result.upgradeBreakdown.warranty > 0)?.result.upgradeBreakdown.warranty;
    if (options.warranty && warrantyPrice)
      upgradeLines.push({ name: "Emerald Pro Warranty", price: warrantyPrice });
    if (options.gutters && firstQ.upgradeBreakdown.gutters > 0)
      upgradeLines.push({ name: "Gutters", price: firstQ.upgradeBreakdown.gutters });
    if (options.gutterGuards && firstQ.upgradeBreakdown.gutterGuards > 0)
      upgradeLines.push({ name: "Gutter Guards (Screens)", price: firstQ.upgradeBreakdown.gutterGuards });
    if (options.boxToRidge && firstQ.upgradeBreakdown.boxToRidge > 0)
      upgradeLines.push({ name: "Box to Ridge Vent Conversion", price: firstQ.upgradeBreakdown.boxToRidge });
  }

  return (
    <>
      {/* ── CUSTOMER-FACING PDF LAYOUT (print only) ── */}
      <div className="hidden print:block">
        <CustomerPDF
          measurements={measurements}
          quotes={quotes}
          upgradeLines={upgradeLines}
        />
      </div>

      {/* ── INTERNAL SCREEN VIEW ── */}
      <div className="max-w-3xl mx-auto print:hidden">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Roof Quote</h2>
            <p className="text-gray-500 text-sm">{measurements.address}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700"
            >
              Export PDF
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              New Quote
            </button>
          </div>
        </div>

        {/* Customer info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Customer</p>
          <p className="font-semibold text-gray-800">{measurements.customerName || "—"}</p>
          <p className="text-sm text-gray-600">{measurements.address}</p>
          {measurements.phone && <p className="text-sm text-gray-600">{measurements.phone}</p>}
          {measurements.email && <p className="text-sm text-gray-600">{measurements.email}</p>}
          <p className="text-sm text-gray-500 mt-2">
            {measurements.squaresWithWaste} squares &middot; {measurements.wastePct}% waste &middot;{" "}
            {Math.round(options.profitMargin * 100)}% margin
          </p>
        </div>

        {/* Comparison table */}
        {quotes.length > 1 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
              Price Comparison
            </h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Product</th>
                    <th className="text-right px-4 py-3">Base Price</th>
                    <th className="text-right px-4 py-3">Per Square</th>
                    {hasUpgrades && <th className="text-right px-4 py-3">With Upgrades</th>}
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(({ product, result }) => (
                    <tr key={product.id} className="border-t border-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.distributor}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {fmt(result.retailPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {fmtDec(result.perSquarePrice)}
                      </td>
                      {hasUpgrades && (
                        <td className="px-4 py-3 text-right font-semibold text-green-700">
                          {result.upgradeBreakdown.total > 0 ? fmt(result.totalWithUpgrades) : "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Per-product detail cards */}
        <div className="space-y-4">
          {quotes.map(({ product, result }) => (
            <ProductCard
              key={product.id}
              product={product}
              result={result}
              options={options}
              expanded={expanded === product.id}
              onToggle={() =>
                setExpanded((prev) => (prev === product.id ? null : product.id))
              }
            />
          ))}
        </div>

        <div className="mt-6 flex gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
          >
            Back to Options
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700"
          >
            Export PDF
          </button>
          {onSendToProduction && (
            <button
              onClick={onSendToProduction}
              disabled={sending}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors ${
                sending
                  ? "bg-green-300 text-white cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {sending ? "Sending…" : "Send to Production →"}
            </button>
          )}
          <button
            onClick={onReset}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            New Quote
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Customer-Facing PDF ───────────────────────────────────────────────────────

function CustomerPDF({
  measurements,
  quotes,
  upgradeLines,
}: {
  measurements: Measurements;
  quotes: ProductQuote[];
  upgradeLines: { name: string; price: number }[];
}) {
  const cell: React.CSSProperties = { padding: "6px 14px", verticalAlign: "top" };
  const divider: React.CSSProperties = { borderTop: "1px solid #ccc" };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#000" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
        <tbody>
          {/* ── Logo + Job Name ── */}
          <tr>
            <td style={{ ...cell, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <HouseSvg />
                <span style={{ fontSize: "19px", fontWeight: "bold", letterSpacing: "-0.2px" }}>
                  modern roof
                </span>
              </div>
            </td>
            <td style={{ ...cell, padding: "12px 14px", textAlign: "right" }}>
              Job Name: {measurements.customerName || measurements.address}
            </td>
          </tr>

          {/* ── Spacer ── */}
          <tr>
            <td colSpan={2} style={{ ...divider, padding: "5px" }} />
          </tr>

          {/* ── Roof size ── */}
          <tr>
            <td colSpan={2} style={{ ...cell, ...divider }}>
              Roof Size with waste: {measurements.squaresWithWaste}
            </td>
          </tr>

          {/* ── Products ── */}
          {quotes.map(({ product, result }) => (
            <QuoteProductRows key={product.id} product={product} result={result} cell={cell} divider={divider} />
          ))}

          {/* ── Upgrade Options header ── */}
          <tr>
            <td colSpan={2} style={{ ...cell, ...divider }}>
              Upgrade Options
            </td>
          </tr>

          {upgradeLines.length > 0 ? (
            upgradeLines.map((u) => (
              <tr key={u.name}>
                <td style={{ ...cell, ...divider }}>{u.name}</td>
                <td style={{ ...cell, ...divider, textAlign: "right", whiteSpace: "nowrap" }}>
                  {fmtDec(u.price)}
                </td>
              </tr>
            ))
          ) : (
            /* Empty placeholder rows when no upgrades selected */
            <>
              <tr>
                <td colSpan={2} style={{ ...divider, padding: "12px 14px" }} />
              </tr>
              <tr>
                <td colSpan={2} style={{ ...divider, padding: "12px 14px" }} />
              </tr>
            </>
          )}

          {/* ── Spacer ── */}
          <tr>
            <td colSpan={2} style={{ ...divider, padding: "5px" }} />
          </tr>

          {/* ── Standard Inclusions header ── */}
          <tr>
            <td colSpan={2} style={{ ...cell, ...divider }}>
              Included in Every Modern Roof quote
            </td>
          </tr>

          {/* ── Inclusion bullets ── */}
          <tr>
            <td
              colSpan={2}
              style={{ ...cell, ...divider, paddingTop: "4px", paddingBottom: "12px", lineHeight: "1.7" }}
            >
              {STANDARD_INCLUSIONS.map((item) => (
                <div key={item}>{`-${item}`}</div>
              ))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function QuoteProductRows({
  product,
  result,
  cell,
  divider,
}: {
  product: ShingleProduct;
  result: QuoteResult;
  cell: React.CSSProperties;
  divider: React.CSSProperties;
}) {
  return (
    <>
      {/* Name + Price */}
      <tr>
        <td style={{ ...cell, ...divider }}>{product.name}</td>
        <td style={{ ...cell, ...divider, textAlign: "right", whiteSpace: "nowrap" }}>
          {fmtDec(result.retailPrice)}
        </td>
      </tr>
      {/* Description */}
      <tr>
        <td
          colSpan={2}
          style={{ ...cell, paddingTop: "3px", paddingBottom: "10px", lineHeight: "1.6" }}
        >
          {`-${product.description}`}
        </td>
      </tr>
      {/* Spacer */}
      <tr>
        <td colSpan={2} style={{ ...divider, padding: "4px" }} />
      </tr>
    </>
  );
}

function HouseSvg() {
  return (
    <svg
      width="28"
      height="26"
      viewBox="0 0 28 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 1L27 12H23V25H5V12H1L14 1Z"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="10" y="16" width="8" height="9" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// ─── Internal Detail Components ────────────────────────────────────────────────

function ProductCard({
  product,
  result,
  options,
  expanded,
  onToggle,
}: {
  product: ShingleProduct;
  result: QuoteResult;
  options: QuoteOptions;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full bg-[#1a2744] text-white px-6 py-4 flex items-center justify-between"
      >
        <div className="text-left">
          <p className="text-xs text-blue-300 font-medium">{product.distributor}</p>
          <p className="text-lg font-bold">{product.name}</p>
          {(product.includesPipeboots || product.includesWarranty) && (
            <div className="flex gap-2 mt-1">
              {product.includesPipeboots && (
                <span className="text-xs bg-green-800 text-green-200 px-2 py-0.5 rounded-full">
                  Lifetime Pipeboots
                </span>
              )}
              {product.includesWarranty && (
                <span className="text-xs bg-green-800 text-green-200 px-2 py-0.5 rounded-full">
                  Emerald Pro Warranty
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{fmt(result.retailPrice)}</p>
          <p className="text-blue-300 text-sm">{fmtDec(result.perSquarePrice)} / sq</p>
          {result.upgradeBreakdown.total > 0 && (
            <p className="text-green-300 text-sm mt-0.5">
              {fmt(result.totalWithUpgrades)} with upgrades
            </p>
          )}
          <p className="text-blue-400 text-xs mt-1">{expanded ? "▲ Hide detail" : "▼ Show detail"}</p>
        </div>
      </button>

      {expanded && (
        <div className="p-6 space-y-6">
          {/* Materials */}
          <section>
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Materials</h4>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-2">Item</th>
                    <th className="text-right px-4 py-2">Qty</th>
                    <th className="text-right px-4 py-2">Unit</th>
                    <th className="text-right px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.materialItems.map((item, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-4 py-2 text-gray-700">{item.name}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{item.qty}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{fmtDec(item.unitCost)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-800">{fmtDec(item.total)}</td>
                    </tr>
                  ))}
                  {result.otherCost > 0 && (
                    <tr className="border-t border-gray-50">
                      <td className="px-4 py-2 text-gray-700">Other / Misc</td>
                      <td className="px-4 py-2 text-right text-gray-500">1</td>
                      <td className="px-4 py-2 text-right text-gray-500">{fmtDec(result.otherCost)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-800">{fmtDec(result.otherCost)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td className="px-4 py-2 text-gray-500 text-xs" colSpan={3}>Subtotal</td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {fmtDec(result.materialSubtotal + result.otherCost)}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td className="px-4 py-2 font-semibold text-gray-700" colSpan={3}>
                      Materials with Tax (7%)
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-gray-900">
                      {fmtDec(result.materialWithTax)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Labor */}
          <section>
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Labor</h4>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-2">Item</th>
                    <th className="text-right px-4 py-2">Qty</th>
                    <th className="text-right px-4 py-2">Rate</th>
                    <th className="text-right px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.laborItems.map((item, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-4 py-2 text-gray-700">{item.name}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{item.qty.toFixed(1)}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{fmtDec(item.rate)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-800">{fmtDec(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td className="px-4 py-2 font-semibold text-gray-700" colSpan={3}>Total Labor</td>
                    <td className="px-4 py-2 text-right font-bold text-gray-900">
                      {fmtDec(result.laborTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Cost / Price summary */}
          <section>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <Row label="Total Cost (material + labor)" value={fmtDec(result.totalCost)} />
              <Row
                label={`Retail Price (${Math.round(options.profitMargin * 100)}% margin)`}
                value={fmt(result.retailPrice)}
                bold
              />
              <Row label="Per Square" value={fmtDec(result.perSquarePrice)} />
            </div>
          </section>

          {/* Upgrades */}
          {result.upgradeBreakdown.total > 0 && (
            <section>
              <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
                Upgrade Package
              </h4>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {result.upgradeBreakdown.pipeboots > 0 && (
                      <tr className="border-t border-gray-50">
                        <td className="px-4 py-2 text-gray-700">Lifetime Pipeboots</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-800">
                          {fmt(result.upgradeBreakdown.pipeboots)}
                        </td>
                      </tr>
                    )}
                    {result.upgradeBreakdown.warranty > 0 && (
                      <tr className="border-t border-gray-50">
                        <td className="px-4 py-2 text-gray-700">Emerald Pro Warranty</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-800">
                          {fmt(result.upgradeBreakdown.warranty)}
                        </td>
                      </tr>
                    )}
                    {result.upgradeBreakdown.gutters > 0 && (
                      <tr className="border-t border-gray-50">
                        <td className="px-4 py-2 text-gray-700">Gutters</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-800">
                          {fmt(result.upgradeBreakdown.gutters)}
                        </td>
                      </tr>
                    )}
                    {result.upgradeBreakdown.gutterGuards > 0 && (
                      <tr className="border-t border-gray-50">
                        <td className="px-4 py-2 text-gray-700">Gutter Guards</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-800">
                          {fmt(result.upgradeBreakdown.gutterGuards)}
                        </td>
                      </tr>
                    )}
                    {result.upgradeBreakdown.boxToRidge > 0 && (
                      <tr className="border-t border-gray-50">
                        <td className="px-4 py-2 text-gray-700">Box to Ridge Conversion</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-800">
                          {fmt(result.upgradeBreakdown.boxToRidge)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td className="px-4 py-2 font-semibold text-gray-700">Upgrade Package Total</td>
                      <td className="px-4 py-2 text-right font-bold text-gray-900">
                        {fmt(result.upgradeBreakdown.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-800">Total with Upgrades</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Commission (8%): {fmt(result.commission)}
                  </p>
                </div>
                <p className="text-3xl font-bold text-green-700">{fmt(result.totalWithUpgrades)}</p>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? "font-semibold text-gray-800" : "text-gray-600"}`}>
        {label}
      </span>
      <span className={`text-sm ${bold ? "font-bold text-gray-900 text-base" : "text-gray-700"}`}>
        {value}
      </span>
    </div>
  );
}
