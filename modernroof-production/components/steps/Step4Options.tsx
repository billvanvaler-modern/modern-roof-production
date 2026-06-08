"use client";

import { useState } from "react";
import type { QuoteOptions, ShingleProduct, JobDetails, Measurements } from "@/lib/types";

interface Props {
  catalog: ShingleProduct[];
  measurements: Measurements;
  jobDetails: JobDetails;
  options: QuoteOptions;
  onBack: () => void;
  onComplete: (o: QuoteOptions) => void;
}

export default function Step4Options({
  catalog,
  measurements,
  jobDetails,
  options: init,
  onBack,
  onComplete,
}: Props) {
  const [o, setO] = useState<QuoteOptions>(init);

  function set<K extends keyof QuoteOptions>(key: K, val: QuoteOptions[K]) {
    setO((prev) => ({ ...prev, [key]: val }));
  }

  function toggleProduct(id: string) {
    setO((prev) => {
      const ids = prev.selectedProductIds.includes(id)
        ? prev.selectedProductIds.filter((x) => x !== id)
        : [...prev.selectedProductIds, id];
      return { ...prev, selectedProductIds: ids };
    });
  }

  const hasGutters = jobDetails.gutterFeet1st + jobDetails.gutterFeet2nd > 0;
  const hasBoxVents =
    jobDetails.ventilation !== "Ridge Vent" && jobDetails.boxVents > 0;
  const marginPct = Math.round(o.profitMargin * 100);
  const canProceed = o.selectedProductIds.length > 0;

  // For upgrade descriptions, use the first selected product (or any) to determine includes
  const firstSelected = catalog.find((p) =>
    o.selectedProductIds.includes(p.id)
  );
  const allSelectedIncludeBoots =
    o.selectedProductIds.length > 0 &&
    o.selectedProductIds.every(
      (id) => catalog.find((p) => p.id === id)?.includesPipeboots
    );
  const allSelectedIncludeWarranty =
    o.selectedProductIds.length > 0 &&
    o.selectedProductIds.every(
      (id) => catalog.find((p) => p.id === id)?.includesWarranty
    );

  // Group products by manufacturer
  const byManufacturer = catalog.reduce<Record<string, ShingleProduct[]>>(
    (acc, p) => {
      (acc[p.manufacturer] ??= []).push(p);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Select Products & Options
      </h2>
      <p className="text-gray-500 mb-8">
        Check all products you want included in this quote. The report will show
        a price for each.
      </p>

      {/* Product Selection */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">
          Products to Quote
        </h3>
        {Object.entries(byManufacturer).map(([manufacturer, products]) => (
          <div key={manufacturer} className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {manufacturer}
            </p>
            <div className="space-y-2">
              {products.map((product) => {
                const selected = o.selectedProductIds.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                      selected
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                          selected
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold ${
                            selected ? "text-blue-700" : "text-gray-800"
                          }`}
                        >
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          {product.description}
                        </p>
                        {(product.includesPipeboots ||
                          product.includesWarranty) && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {product.includesPipeboots && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                Lifetime Pipeboots Included
                              </span>
                            )}
                            {product.includesWarranty && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                Emerald Pro Warranty Included
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {canProceed && (
          <p className="text-xs text-blue-600 mt-2">
            {o.selectedProductIds.length} product
            {o.selectedProductIds.length !== 1 ? "s" : ""} selected
          </p>
        )}
      </section>

      {/* Upgrade Options */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">
          Upgrade Package
        </h3>
        <div className="space-y-3">
          <UpgradeToggle
            label="Lifetime Pipeboots"
            description={
              allSelectedIncludeBoots
                ? "Included with all selected products"
                : firstSelected?.includesPipeboots
                ? "Included with some selected products; charged for others"
                : `$149 per pipe jack (${jobDetails.pipeJacks} jacks = $${(
                    jobDetails.pipeJacks * 149
                  ).toLocaleString()})`
            }
            checked={o.pipeboots || allSelectedIncludeBoots}
            disabled={allSelectedIncludeBoots}
            onChange={(v) => set("pipeboots", v)}
          />
          <UpgradeToggle
            label="Emerald Pro Warranty"
            description={
              allSelectedIncludeWarranty
                ? "Included with all selected products"
                : firstSelected?.includesWarranty
                ? "Included with some selected products; charged for others"
                : `$35/sq on ${measurements.squaresWithWaste} sq = $${(
                    measurements.squaresWithWaste * 35
                  ).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            }
            checked={o.warranty || allSelectedIncludeWarranty}
            disabled={allSelectedIncludeWarranty}
            onChange={(v) => set("warranty", v)}
          />
          <UpgradeToggle
            label="Gutters"
            description={
              hasGutters
                ? `$12/lf on ${
                    jobDetails.gutterFeet1st + jobDetails.gutterFeet2nd
                  } lf = $${(
                    (jobDetails.gutterFeet1st + jobDetails.gutterFeet2nd) *
                    12
                  ).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : "Enter gutter footage in Job Details to enable"
            }
            checked={o.gutters}
            disabled={!hasGutters}
            onChange={(v) => set("gutters", v)}
          />
          <UpgradeToggle
            label="Gutter Guards (Screens)"
            description={
              hasGutters
                ? `$12/lf on ${
                    jobDetails.gutterFeet1st + jobDetails.gutterFeet2nd
                  } lf = $${(
                    (jobDetails.gutterFeet1st + jobDetails.gutterFeet2nd) *
                    12
                  ).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : "Enter gutter footage in Job Details to enable"
            }
            checked={o.gutterGuards}
            disabled={!hasGutters}
            onChange={(v) => set("gutterGuards", v)}
          />
          <UpgradeToggle
            label="Box to Ridge Vent Conversion"
            description={
              hasBoxVents
                ? "$13.50/lf ridge + $21 per box vent plugged"
                : "Set ventilation to Box Vents in Job Details to enable"
            }
            checked={o.boxToRidge}
            disabled={!hasBoxVents}
            onChange={(v) => set("boxToRidge", v)}
          />
        </div>
      </section>

      {/* Profit Margin */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">
          Profit Margin
        </h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={20}
            max={60}
            step={1}
            value={marginPct}
            onChange={(e) =>
              set("profitMargin", parseInt(e.target.value) / 100)
            }
            className="flex-1 accent-blue-600"
          />
          <div className="w-16 text-center">
            <span className="text-2xl font-bold text-blue-700">
              {marginPct}%
            </span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>20%</span>
          <span>40% (default)</span>
          <span>60%</span>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
        >
          Back
        </button>
        <button
          onClick={() => onComplete(o)}
          disabled={!canProceed}
          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors ${
            canProceed
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Generate Quote{o.selectedProductIds.length > 1 ? "s" : ""} →
        </button>
      </div>
    </div>
  );
}

function UpgradeToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={`p-4 rounded-xl border-2 transition-colors ${
        checked && !disabled
          ? "border-blue-600 bg-blue-50"
          : disabled
          ? "border-gray-100 bg-gray-50 opacity-60"
          : "border-gray-200"
      }`}
    >
      <label
        className={`flex items-start gap-3 ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 flex-shrink-0"
        />
        <div>
          <p className="text-sm font-semibold text-gray-700">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </label>
    </div>
  );
}
