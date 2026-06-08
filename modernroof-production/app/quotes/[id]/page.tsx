"use client";

import { useState, useCallback, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Measurements, JobDetails, QuoteOptions, ShingleProduct } from "@/lib/types";
import type { ProductQuote } from "@/components/steps/Step5Quote";
import { calculateQuote } from "@/lib/calculateQuote";
import { fetchCatalog } from "@/lib/catalog";
import Step1Upload from "@/components/steps/Step1Upload";
import Step2Measurements from "@/components/steps/Step2Measurements";
import Step3Details from "@/components/steps/Step3Details";
import Step4Options from "@/components/steps/Step4Options";
import Step5Quote from "@/components/steps/Step5Quote";

const STEPS = ["Upload", "Measurements", "Job Details", "Options", "Quote"];

const DEFAULT_JOB_DETAILS: JobDetails = {
  ventilation: "Ridge Vent",
  boxVents: 0, pipeJacks: 0, furnaceVents: 0, osbSheets: 0,
  brickFlashing: false,
  chimneySmall: 0, chimneyMedium: 0, chimneyLarge: 0,
  skylightReplace: 0, skylightReFlash: 0,
  cricketSmall: 0, cricketMedium: 0, cricketLarge: 0,
  area4_12: 0, area8_12: 0, area10_12: 0, area12_12: 0,
  area2Story: 0, area2Layers: 0,
  osbLabor8_12: 0, osbLabor10_12: 0, osbLabor12_12: 0,
  gutterFeet1st: 0, downspouts1st: 0,
  gutterFeet2nd: 0, downspouts2nd: 0,
  customOtherCost: 0,
  customLaborCost: 0,
};

const DEFAULT_OPTIONS: QuoteOptions = {
  selectedProductIds: ["malarkey-highlander"],
  pipeboots: false, warranty: false, gutters: false,
  gutterGuards: false, boxToRidge: false,
  profitMargin: 0.4,
};

const EMPTY_MEASUREMENTS: Measurements = {
  customerName: "", address: "", phone: "", email: "",
  totalAreaSqft: 0, pitchedAreaSqft: 0, flatAreaSqft: 0,
  twoStoryAreaSqft: 0, twoLayerAreaSqft: 0,
  predominantPitch: "",
  eaves: 0, valleys: 0, hips: 0, ridges: 0, rakes: 0,
  stepFlashing: 0, wallFlashing: 0,
  wastePct: 10, squaresWithWaste: 0, wasteTable: {},
};

// Extract the rise number from any pitch string: "4/12", "4:12", "4", "4.0"
function pitchRise(pitchStr: string): number {
  const m = pitchStr.match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function distributePitchAreas(m: Measurements): Partial<JobDetails> {
  const pt = m.pitchTable ?? {};
  const totalPitchedSqft =
    Object.values(pt).reduce((s, v) => s + v, 0) || m.pitchedAreaSqft || m.totalAreaSqft;
  let area4_12 = 0, area8_12 = 0, area10_12 = 0, area12_12 = 0;

  for (const [pitch, sqft] of Object.entries(pt)) {
    const num = pitchRise(pitch);
    const proportion = totalPitchedSqft > 0 ? sqft / totalPitchedSqft : 0;
    const squares = Math.round(proportion * m.squaresWithWaste * 10) / 10;
    if (num <= 4) area4_12 += squares;
    else if (num >= 8 && num <= 9) area8_12 += squares;
    else if (num >= 10 && num <= 11) area10_12 += squares;
    else if (num >= 12) area12_12 += squares;
    // 5/12–7/12: no surcharge, leave at 0
  }

  // Fallback: if pitchTable didn't produce any values AND we know the predominant pitch, use it
  const distributed = area4_12 + area8_12 + area10_12 + area12_12;
  if (distributed === 0 && m.squaresWithWaste > 0) {
    const pitchSrc = m.predominantPitch || (Object.keys(pt)[0] ?? "");
    if (pitchSrc) {
      const num = pitchRise(pitchSrc);
      if (num <= 4) area4_12 = m.squaresWithWaste;
      else if (num >= 8 && num <= 9) area8_12 = m.squaresWithWaste;
      else if (num >= 10 && num <= 11) area10_12 = m.squaresWithWaste;
      else if (num >= 12) area12_12 = m.squaresWithWaste;
    }
  }

  return {
    area4_12: Math.round(area4_12 * 10) / 10,
    area8_12: Math.round(area8_12 * 10) / 10,
    area10_12: Math.round(area10_12 * 10) / 10,
    area12_12: Math.round(area12_12 * 10) / 10,
    area2Story: m.twoStoryAreaSqft / 100,
    area2Layers: m.twoLayerAreaSqft / 100,
  };
}

export default function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quoteId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [measurements, setMeasurements] = useState<Measurements>(EMPTY_MEASUREMENTS);
  const [jobDetails, setJobDetails] = useState<JobDetails>(DEFAULT_JOB_DETAILS);
  const [options, setOptions] = useState<QuoteOptions>(DEFAULT_OPTIONS);
  const [quotes, setQuotes] = useState<ProductQuote[]>([]);
  const [catalog, setCatalog] = useState<ShingleProduct[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [sending, setSending] = useState(false);

  // Load catalog first
  useEffect(() => {
    fetchCatalog().then((c) => { setCatalog(c); setCatalogReady(true); });
  }, []);

  // Load quote from DB once catalog is ready
  useEffect(() => {
    if (!catalogReady) return;

    async function load() {
      const res = await fetch(`/api/quotes/${quoteId}`);
      if (!res.ok) { router.push("/quote"); return; }
      const q = await res.json();
      if (!q) { router.push("/quote"); return; }

      const m: Measurements | null = q.measurements ?? null;
      const jd: JobDetails | null = q.job_details ?? null;
      const o: QuoteOptions | null = q.options ?? null;

      if (m) {
        setMeasurements(m);
        if (jd) {
          setJobDetails(jd);
          if (o) {
            setOptions(o);
            // Recalculate quote results
            const results: ProductQuote[] = (o.selectedProductIds ?? [])
              .map((pid: string) => catalog.find((p) => p.id === pid))
              .filter((p: ShingleProduct | undefined): p is ShingleProduct => !!p)
              .map((product: ShingleProduct) => ({
                product,
                result: calculateQuote(m, jd, o, product),
              }));
            setQuotes(results);
            setStep(q.status === "sent" ? 4 : 4);
          } else {
            setStep(3);
          }
        } else {
          setStep(2);
        }
      } else {
        setStep(0); // No measurements yet — show upload
      }

      setLoading(false);
    }

    load();
  }, [catalogReady, quoteId, router]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save helper — fire and forget
  function autosave(updates: Record<string, unknown>) {
    fetch(`/api/quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(() => {}); // silent — data is still in state if it fails
  }

  function handleUploadComplete(m: Measurements) {
    setMeasurements(m);
    autosave({
      customer_name: m.customerName,
      address: m.address,
      measurements: m,
    });
    setStep(1);
  }

  function handleMeasurementsComplete(m: Measurements) {
    setMeasurements(m);
    const pitchAreas = distributePitchAreas(m);
    const newJobDetails = { ...DEFAULT_JOB_DETAILS, ...pitchAreas };
    setJobDetails(newJobDetails);
    autosave({ measurements: m });
    setStep(2);
  }

  function handleDetailsComplete(d: JobDetails) {
    setJobDetails(d);
    autosave({ job_details: d });
    setStep(3);
  }

  function handleOptionsComplete(o: QuoteOptions) {
    setOptions(o);
    const results: ProductQuote[] = o.selectedProductIds
      .map((pid) => catalog.find((p) => p.id === pid))
      .filter((p): p is ShingleProduct => !!p)
      .map((product) => ({
        product,
        result: calculateQuote(measurements, jobDetails, o, product),
      }));
    setQuotes(results);
    autosave({ options: o });
    setStep(4);
  }

  const handleReset = useCallback(() => {
    router.push("/quote");
  }, [router]);

  async function handleSendToProduction() {
    setSending(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          measurements,
          jobDetails,
          options,
          results: quotes.map((q) => ({
            productId: q.product.id,
            productName: q.product.name,
            retailPrice: q.result.retailPrice,
            totalWithUpgrades: q.result.totalWithUpgrades,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to create job");
      const { jobId } = await res.json();

      // Same app — redirect to pre-production form
      router.push(`/job/${jobId}`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong creating the job. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading quote…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a2744] text-white px-6 py-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/quote" className="hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-bold tracking-tight">Modern Roof</h1>
              <p className="text-blue-300 text-xs">Quote Generator</p>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/quote" className="text-blue-300 hover:text-white text-sm transition-colors">
              All Quotes
            </Link>
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
        </div>
      </header>

      {/* Step Indicator */}
      {step < 4 && (
        <div className="bg-white border-b border-gray-100 print:hidden">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex">
              {STEPS.map((label, idx) => (
                <div
                  key={idx}
                  className={`flex-1 py-3 text-center text-xs font-medium border-b-2 transition-colors ${
                    idx === step
                      ? "border-blue-600 text-blue-600"
                      : idx < step
                      ? "border-blue-200 text-blue-400"
                      : "border-transparent text-gray-400"
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-1.5 text-xs font-bold ${
                    idx < step ? "bg-blue-100 text-blue-600" : idx === step ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    {idx < step ? "✓" : idx + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {step === 0 && (
          <Step1Upload onComplete={handleUploadComplete} />
        )}
        {step === 1 && (
          <Step2Measurements
            measurements={measurements}
            onBack={() => setStep(0)}
            onComplete={handleMeasurementsComplete}
          />
        )}
        {step === 2 && (
          <Step3Details
            measurements={measurements}
            jobDetails={jobDetails}
            onBack={() => setStep(1)}
            onComplete={handleDetailsComplete}
          />
        )}
        {step === 3 && (
          <Step4Options
            catalog={catalog}
            measurements={measurements}
            jobDetails={jobDetails}
            options={options}
            onBack={() => setStep(2)}
            onComplete={handleOptionsComplete}
          />
        )}
        {step === 4 && quotes.length > 0 && (
          <Step5Quote
            measurements={measurements}
            options={options}
            quotes={quotes}
            onBack={() => setStep(3)}
            onReset={handleReset}
            onSendToProduction={handleSendToProduction}
            sending={sending}
          />
        )}
      </main>
    </div>
  );
}
