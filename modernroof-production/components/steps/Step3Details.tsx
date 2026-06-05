"use client";

import { useState } from "react";
import type { JobDetails, Measurements, VentilationType } from "@/lib/types";

interface Props {
  measurements: Measurements;
  jobDetails: JobDetails;
  onBack: () => void;
  onComplete: (d: JobDetails) => void;
}

function NumField({
  label,
  value,
  onChange,
  suffix = "",
  hint = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <div className="relative">
        <input
          type="number"
          value={value}
          min={0}
          step="any"
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{suffix}</span>
        )}
      </div>
    </div>
  );
}

export default function Step3Details({ measurements, jobDetails: init, onBack, onComplete }: Props) {
  const [d, setD] = useState<JobDetails>(init);

  function set<K extends keyof JobDetails>(key: K, val: JobDetails[K]) {
    setD((prev) => ({ ...prev, [key]: val }));
  }

  // Total gutter feet
  const totalGutterFeet = d.gutterFeet1st + d.gutterFeet2nd;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Details</h2>
      <p className="text-gray-500 mb-8">
        Enter the on-site details that aren't in the Roofr report.
      </p>

      {/* Ventilation */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">Ventilation</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {(["Ridge Vent", "Box Vents", "Box to Ridge Conversion"] as VentilationType[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => set("ventilation", v)}
              className={`p-3 rounded-xl border-2 text-sm font-medium text-center transition-colors ${
                d.ventilation === v
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {d.ventilation !== "Ridge Vent" && (
          <NumField
            label="Number of Box Vents"
            value={d.boxVents}
            onChange={(v) => set("boxVents", v)}
          />
        )}
      </section>

      {/* Penetrations */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">Penetrations</h3>
        <div className="grid grid-cols-2 gap-4">
          <NumField label="Pipe Jacks" value={d.pipeJacks} onChange={(v) => set("pipeJacks", v)} />
          <NumField label="Furnace Roof Vents" value={d.furnaceVents} onChange={(v) => set("furnaceVents", v)} />
        </div>

        {/* Brick flashing */}
        <div className="mt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={d.brickFlashing}
              onChange={(e) => set("brickFlashing", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Brick Flashing Needed
            </span>
          </label>
          {d.brickFlashing && (
            <p className="mt-1 ml-7 text-xs text-amber-600">
              Brick flashing requires a custom price from your sub — add it to the "Other Costs" field at the bottom.
            </p>
          )}
        </div>
      </section>

      {/* Chimneys */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">Chimneys</h3>
        <div className="grid grid-cols-3 gap-4">
          <NumField label="Small" value={d.chimneySmall} onChange={(v) => set("chimneySmall", v)} hint="Labor $150 each" />
          <NumField label="Medium" value={d.chimneyMedium} onChange={(v) => set("chimneyMedium", v)} hint="Labor $200 each" />
          <NumField label="Large" value={d.chimneyLarge} onChange={(v) => set("chimneyLarge", v)} hint="Labor $250 each" />
        </div>
      </section>

      {/* Skylights */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">Skylights</h3>
        <div className="grid grid-cols-2 gap-4">
          <NumField label="Replace" value={d.skylightReplace} onChange={(v) => set("skylightReplace", v)} hint="Labor $150 each" />
          <NumField label="Re-Flash" value={d.skylightReFlash} onChange={(v) => set("skylightReFlash", v)} hint="Labor $75 each" />
        </div>
      </section>

      {/* Crickets */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">Crickets to Build</h3>
        <div className="grid grid-cols-3 gap-4">
          <NumField label="Small" value={d.cricketSmall} onChange={(v) => set("cricketSmall", v)} hint="Labor $100 each" />
          <NumField label="Medium" value={d.cricketMedium} onChange={(v) => set("cricketMedium", v)} hint="Labor $200 each" />
          <NumField label="Large" value={d.cricketLarge} onChange={(v) => set("cricketLarge", v)} hint="Labor $300 each" />
        </div>
      </section>

      {/* Pitch / Complexity */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">Pitch & Complexity</h3>
        <p className="text-xs text-gray-400 mb-3">
          Enter the area in squares for each pitch/situation that adds a labor surcharge. Leave as 0 if not applicable.
          Total should not exceed {measurements.squaresWithWaste} squares.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <NumField label="Area 4/12 or Less (double felt)" value={d.area4_12} onChange={(v) => set("area4_12", v)} suffix="sq" hint="+$10/sq labor" />
          <NumField label="Area 8/12–9/12" value={d.area8_12} onChange={(v) => set("area8_12", v)} suffix="sq" hint="+$15/sq labor" />
          <NumField label="Area 10/12–11/12" value={d.area10_12} onChange={(v) => set("area10_12", v)} suffix="sq" hint="+$20/sq labor" />
          <NumField label="Area 12/12+" value={d.area12_12} onChange={(v) => set("area12_12", v)} suffix="sq" hint="+$25/sq labor" />
          <NumField label="2-Story Area" value={d.area2Story} onChange={(v) => set("area2Story", v)} suffix="sq" hint="+$15/sq labor" />
          <NumField label="2-Layer Tearoff" value={d.area2Layers} onChange={(v) => set("area2Layers", v)} suffix="sq" hint="+$10/sq labor" />
        </div>
      </section>

      {/* OSB */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">Damaged Decking (OSB)</h3>
        <div className="grid grid-cols-2 gap-4">
          <NumField label="OSB Sheets to Order" value={d.osbSheets} onChange={(v) => set("osbSheets", v)} suffix="sheets" hint="$24.95/sheet material" />
          <div />
          <NumField label="OSB Labor Sheets up to 9/12" value={d.osbLabor8_12} onChange={(v) => set("osbLabor8_12", v)} suffix="sheets" hint="$10/sheet labor" />
          <NumField label="OSB Labor Sheets 10/12–11/12" value={d.osbLabor10_12} onChange={(v) => set("osbLabor10_12", v)} suffix="sheets" hint="$15/sheet labor" />
          <NumField label="OSB Labor Sheets 12/12+" value={d.osbLabor12_12} onChange={(v) => set("osbLabor12_12", v)} suffix="sheets" hint="$25/sheet labor" />
        </div>
      </section>

      {/* Gutters */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">Gutters</h3>
        <p className="text-xs text-gray-400 mb-3">
          Enter gutter measurements to enable the gutter and gutter guard upgrade options.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <NumField label="1st Level Gutter Feet" value={d.gutterFeet1st} onChange={(v) => set("gutterFeet1st", v)} suffix="lf" />
          <NumField label="1st Level Downspouts" value={d.downspouts1st} onChange={(v) => set("downspouts1st", v)} />
          <NumField label="2nd Level Gutter Feet" value={d.gutterFeet2nd} onChange={(v) => set("gutterFeet2nd", v)} suffix="lf" />
          <NumField label="2nd Level Downspouts" value={d.downspouts2nd} onChange={(v) => set("downspouts2nd", v)} />
        </div>
        {totalGutterFeet > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Total: <span className="font-semibold">{totalGutterFeet.toFixed(0)} lf</span>
          </p>
        )}
      </section>

      {/* Other costs */}
      <section className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">Other Costs</h3>
        <NumField
          label="Other / Misc Material Costs"
          value={d.customOtherCost}
          onChange={(v) => set("customOtherCost", v)}
          suffix="$"
          hint="Brick flashing, special materials, etc. (tax applied)"
        />
      </section>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
        >
          Back
        </button>
        <button
          onClick={() => onComplete(d)}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Next: Shingle & Options →
        </button>
      </div>
    </div>
  );
}
