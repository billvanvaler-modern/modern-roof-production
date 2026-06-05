"use client";

import { useState } from "react";
import type { Measurements } from "@/lib/types";
import { WASTE_OPTIONS } from "@/lib/pricing";

function wasteOptionsFromTable(m: Measurements): number[] {
  const keys = Object.keys(m.wasteTable ?? {}).map(Number);
  return keys.length > 0 ? keys.sort((a, b) => a - b) : WASTE_OPTIONS;
}

interface Props {
  measurements: Measurements;
  onBack: () => void;
  onComplete: (m: Measurements) => void;
}

function Field({
  label,
  value,
  onChange,
  suffix = "",
  type = "number",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  suffix?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
          min={0}
          step="any"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Step2Measurements({ measurements: init, onBack, onComplete }: Props) {
  const [m, setM] = useState<Measurements>(init);

  function update<K extends keyof Measurements>(key: K, val: string) {
    const numVal = parseFloat(val) || 0;
    setM((prev) => {
      const next = { ...prev, [key]: key === "customerName" || key === "address" || key === "phone" || key === "email" || key === "predominantPitch" ? val : numVal };

      // When waste % changes, use Roofr's pre-calculated value if available
      if (key === "wastePct") {
        const table = prev.wasteTable ?? {};
        if (table[numVal] !== undefined) {
          next.squaresWithWaste = table[numVal];
        } else {
          next.squaresWithWaste = Math.round((prev.totalAreaSqft / 100) * (1 + numVal / 100) * 10) / 10;
        }
      }
      // If area changes, recalculate from formula (no Roofr table available for edited values)
      if (key === "totalAreaSqft") {
        const waste = prev.wastePct;
        next.squaresWithWaste = Math.round((numVal / 100) * (1 + waste / 100) * 10) / 10;
      }

      return next;
    });
  }

  function updateText(key: keyof Measurements, val: string) {
    setM((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Measurements</h2>
      <p className="text-gray-500 mb-8">
        These values were pulled from your Roofr report. Review and adjust anything that looks off.
      </p>

      {/* Customer Info */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">Customer</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">Customer Name</label>
            <input
              type="text"
              value={m.customerName}
              onChange={(e) => updateText("customerName", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
            <input
              type="text"
              value={m.address}
              onChange={(e) => updateText("address", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
            <input
              type="text"
              value={m.phone}
              onChange={(e) => updateText("phone", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={m.email}
              onChange={(e) => updateText("email", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Roof Area */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">Roof Area</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Total Roof Area" value={m.totalAreaSqft} onChange={(v) => update("totalAreaSqft", v)} suffix="sqft" />
          <Field label="Pitched Area" value={m.pitchedAreaSqft} onChange={(v) => update("pitchedAreaSqft", v)} suffix="sqft" />
          <Field label="Flat Area" value={m.flatAreaSqft} onChange={(v) => update("flatAreaSqft", v)} suffix="sqft" />
          <Field label="Two-Story Area" value={m.twoStoryAreaSqft} onChange={(v) => update("twoStoryAreaSqft", v)} suffix="sqft" />
          <Field label="Two-Layer Area" value={m.twoLayerAreaSqft} onChange={(v) => update("twoLayerAreaSqft", v)} suffix="sqft" />
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Predominant Pitch</label>
            <input
              type="text"
              value={m.predominantPitch}
              onChange={(e) => updateText("predominantPitch", e.target.value)}
              placeholder="5/12"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Waste selector */}
        <div className="mt-4 p-4 bg-blue-50 rounded-xl">
          {m.recommendedWastePct !== undefined && (
            <div className="mb-3 flex items-start gap-2 p-3 bg-white border border-blue-200 rounded-lg">
              <span className="text-blue-500 mt-0.5">ℹ</span>
              <p className="text-sm text-gray-700">
                Roofr recommends <span className="font-bold text-blue-700">{m.recommendedWastePct}% waste</span> for this roof.
                {m.wastePct === m.recommendedWastePct
                  ? " It's pre-selected below — change it if needed."
                  : " You've selected a different percentage."}
              </p>
            </div>
          )}
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waste Percentage
          </label>
          <div className="flex flex-wrap gap-2">
            {wasteOptionsFromTable(m).map((pct) => {
              const roofr = m.wasteTable?.[pct];
              const isRecommended = pct === m.recommendedWastePct;
              const isSelected = m.wastePct === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => update("wastePct", String(pct))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-center min-w-[56px] relative ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                  }`}
                >
                  {isRecommended && (
                    <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1 rounded whitespace-nowrap ${
                      isSelected ? "bg-white text-blue-600" : "bg-blue-600 text-white"
                    }`}>
                      REC
                    </span>
                  )}
                  <div className={isRecommended ? "mt-1" : ""}>{pct}%</div>
                  {roofr !== undefined && (
                    <div className={`text-xs mt-0.5 ${isSelected ? "text-blue-100" : "text-gray-400"}`}>
                      {roofr} sq
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            <span className="font-semibold text-gray-700">Squares with waste:</span>{" "}
            <span className="text-blue-700 font-bold text-lg">{m.squaresWithWaste}</span> sq
            {m.wasteTable?.[m.wastePct] !== undefined
              ? " (from Roofr report)"
              : ` (${(m.totalAreaSqft / 100).toFixed(1)} base × ${(1 + m.wastePct / 100).toFixed(2)})`}
          </p>
        </div>
      </section>

      {/* Linear Measurements */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">Linear Measurements</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Eaves" value={m.eaves} onChange={(v) => update("eaves", v)} suffix="lf" />
          <Field label="Rakes" value={m.rakes} onChange={(v) => update("rakes", v)} suffix="lf" />
          <Field label="Ridges" value={m.ridges} onChange={(v) => update("ridges", v)} suffix="lf" />
          <Field label="Hips" value={m.hips} onChange={(v) => update("hips", v)} suffix="lf" />
          <Field label="Valleys" value={m.valleys} onChange={(v) => update("valleys", v)} suffix="lf" />
          <Field label="Wall Flashing" value={m.wallFlashing} onChange={(v) => update("wallFlashing", v)} suffix="lf" />
          <Field label="Step Flashing" value={m.stepFlashing} onChange={(v) => update("stepFlashing", v)} suffix="lf" />
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
          onClick={() => onComplete(m)}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Next: Job Details →
        </button>
      </div>
    </div>
  );
}
