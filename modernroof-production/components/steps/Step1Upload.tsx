"use client";

import { useState, useRef } from "react";
import type { Measurements } from "@/lib/types";
import { WASTE_OPTIONS } from "@/lib/pricing";

interface Props {
  onComplete: (measurements: Measurements) => void;
}

export default function Step1Upload({ onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError("");
    setFileName(file.name);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/parse-pdf", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to parse PDF");
        return;
      }

      const parsed = json.measurements;

      // Use Roofr's recommended waste % if present, otherwise fall back to 10%
      const wastePct = parsed.recommendedWastePct ?? 10;
      const squaresWithWaste =
        parsed.wasteTable?.[wastePct] ??
        Math.round((parsed.totalAreaSqft / 100) * (1 + wastePct / 100) * 10) / 10;

      const measurements: Measurements = {
        ...parsed,
        wastePct,
        squaresWithWaste,
      };

      onComplete(measurements);
    } catch {
      setError("Could not read the PDF. Make sure it is a Roofr report.");
    } finally {
      setLoading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Roofr Report</h2>
      <p className="text-gray-500 mb-8">
        Upload the PDF measurement report from Roofr and we'll automatically fill in all the roof dimensions.
      </p>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-blue-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onInputChange}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-blue-600 font-medium">Reading {fileName}…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg className="h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className="font-semibold text-gray-700">Drop your Roofr PDF here</p>
              <p className="text-sm text-gray-400 mt-1">or click to browse</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-xl">
        <p className="text-sm font-semibold text-gray-600 mb-2">What gets auto-filled from Roofr:</p>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>• Customer name, address, phone, and email</li>
          <li>• Total roof area, pitched area, and square count</li>
          <li>• Linear feet of eaves, valleys, hips, ridges, rakes, and flashing</li>
          <li>• Predominant pitch and per-pitch area breakdown</li>
        </ul>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Roofr reports include a waste percentage table. You'll select your waste % on the next screen.
        Recommended waste options: {WASTE_OPTIONS.join("%, ")}%
      </p>
    </div>
  );
}
