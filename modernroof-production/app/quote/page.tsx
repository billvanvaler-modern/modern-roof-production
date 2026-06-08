"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Measurements } from "@/lib/types";
import Step1Upload from "@/components/steps/Step1Upload";

interface QuoteSummary {
  id: string;
  customer_name: string | null;
  address: string | null;
  status: "draft" | "sent";
  updated_at: string;
}

// Dev-only test data
const TEST_MEASUREMENTS: Measurements = {
  customerName: "Megan Van Valer",
  address: "7772 Dean Road, Indianapolis, IN 46240",
  phone: "3172818415",
  email: "bvanvaler@stonycreekgolfclub.com",
  totalAreaSqft: 3589, pitchedAreaSqft: 3338, flatAreaSqft: 251,
  twoStoryAreaSqft: 0, twoLayerAreaSqft: 0,
  predominantPitch: "5/12",
  eaves: 315.5, valleys: 40, hips: 191.67, ridges: 91.17,
  rakes: 0, stepFlashing: 0, wallFlashing: 0,
  wastePct: 10, squaresWithWaste: 39.5,
  wasteTable: { 0: 35.9, 9: 39.2, 10: 39.5, 12: 40.2, 15: 41.3, 17: 42.0, 20: 43.1 },
  recommendedWastePct: 10,
  pitchTable: { "5/12": 3338 },
};

export default function Home() {
  const isDev = process.env.NODE_ENV === "development";
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/quotes")
      .then((r) => r.json())
      .then(setQuotes)
      .catch(() => {});
  }, []);

  async function deleteQuote(id: string) {
    if (!confirm("Delete this quote? This cannot be undone.")) return;
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }

  async function createAndRedirect(measurements?: Measurements) {
    setCreating(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          measurements
            ? {
                customer_name: measurements.customerName,
                address: measurements.address,
                measurements,
              }
            : {}
        ),
      });
      const { id } = await res.json();
      router.push(`/quotes/${id}`);
    } catch {
      setCreating(false);
    }
  }

  function handleUploadComplete(m: Measurements) {
    createAndRedirect(m);
  }

  const draftQuotes = quotes.filter((q) => q.status === "draft");
  const sentQuotes = quotes.filter((q) => q.status === "sent");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a2744] text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Modern Roof</h1>
            <p className="text-blue-300 text-xs">Quote Generator</p>
          </div>
          <Link
            href="/settings"
            className="text-blue-300 hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Products
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Upload — start a new quote */}
        <section>
          <Step1Upload onComplete={handleUploadComplete} />
          {isDev && (
            <div className="mt-4 text-center">
              <button
                onClick={() => createAndRedirect(TEST_MEASUREMENTS)}
                disabled={creating}
                className="text-xs text-gray-400 underline hover:text-gray-600"
              >
                [dev] skip to step 2 with Dean Road data
              </button>
            </div>
          )}
        </section>

        {/* Quotes list */}
        {quotes.length > 0 && (
          <section>
            {/* In-progress drafts */}
            {draftQuotes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
                  In Progress
                </h2>
                <div className="space-y-2">
                  {draftQuotes.map((q) => (
                    <QuoteRow key={q.id} quote={q} onDelete={deleteQuote} />
                  ))}
                </div>
              </div>
            )}

            {/* Sent to production */}
            {sentQuotes.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
                  Sent to Production
                </h2>
                <div className="space-y-2">
                  {sentQuotes.map((q) => (
                    <QuoteRow key={q.id} quote={q} onDelete={deleteQuote} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {creating && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-xl">
            <p className="text-gray-700 font-medium">Creating quote…</p>
          </div>
        </div>
      )}
    </div>
  );
}

function QuoteRow({ quote, onDelete }: { quote: QuoteSummary; onDelete: (id: string) => void }) {
  const date = new Date(quote.updated_at);
  const timeAgo = formatTimeAgo(date);

  return (
    <div className="flex items-center gap-2 group">
      <Link
        href={`/quotes/${quote.id}`}
        className="flex-1 flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
      >
        <div>
          <p className="font-medium text-gray-900 group-hover:text-blue-700">
            {quote.customer_name || "Unnamed Customer"}
          </p>
          <p className="text-sm text-gray-500">{quote.address || "No address"}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${
            quote.status === "sent"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}>
            {quote.status === "sent" ? "Sent" : "Draft"}
          </span>
          <p className="text-xs text-gray-400">{timeAgo}</p>
        </div>
      </Link>
      <button
        onClick={() => onDelete(quote.id)}
        title="Delete quote"
        className="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
