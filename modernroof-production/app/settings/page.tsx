"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ShingleProduct } from "@/lib/types";
import { fetchCatalog, pushCatalog, resetCatalogRemote, DEFAULT_CATALOG } from "@/lib/catalog";

const EMPTY_PRODUCT: Omit<ShingleProduct, "id"> = {
  name: "",
  distributor: "",
  description: "",
  costPerBundle: 0,
  bundlesPerSquare: 3,
  includesPipeboots: false,
  includesWarranty: false,
  hipRidgeCostPerBundle: 0,
  starterCostPerBundle: 0,
  underlaymentCostPerRoll: 0,
  iceWaterCostPerRoll: 0,
  ridgeVentCostPer4ft: 0,
  pipeJackCost: 0,
  hipRidgeLfPerBundle: 31,
  starterLfPerBundle: 114,
  underlaymentSqPerRoll: 10,
  iceWaterLfPerRoll: 66,
};

function generateId(name: string, distributor: string): string {
  return `${distributor}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function SettingsPage() {
  const [catalog, setCatalog] = useState<ShingleProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<ShingleProduct, "id">>(EMPTY_PRODUCT);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    fetchCatalog().then((c) => { setCatalog(c); setLoading(false); });
  }, []);

  async function persist(updated: ShingleProduct[]) {
    setSaving(true);
    await pushCatalog(updated);
    setCatalog(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function startAdd() {
    setIsAdding(true);
    setEditingId(null);
    setForm(EMPTY_PRODUCT);
  }

  function startEdit(product: ShingleProduct) {
    setEditingId(product.id);
    setIsAdding(false);
    const { id: _id, ...rest } = product;
    setForm(rest);
  }

  function cancelForm() {
    setIsAdding(false);
    setEditingId(null);
    setForm(EMPTY_PRODUCT);
  }

  async function saveForm() {
    if (!form.name.trim() || !form.distributor.trim()) return;
    if (isAdding) {
      const newProduct: ShingleProduct = {
        id: generateId(form.name, form.distributor),
        ...form,
      };
      await persist([...catalog, newProduct]);
      setIsAdding(false);
    } else if (editingId) {
      await persist(catalog.map((p) => (p.id === editingId ? { id: editingId, ...form } : p)));
      setEditingId(null);
    }
    setForm(EMPTY_PRODUCT);
  }

  async function deleteProduct(id: string) {
    await persist(catalog.filter((p) => p.id !== id));
  }

  async function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    const defaults = await resetCatalogRemote();
    setCatalog(defaults);
    setConfirmReset(false);
    setIsAdding(false);
    setEditingId(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function setField<K extends keyof Omit<ShingleProduct, "id">>(key: K, val: (Omit<ShingleProduct, "id">)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function moveProduct(index: number, direction: "up" | "down") {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= catalog.length) return;
    const reordered = [...catalog];
    [reordered[index], reordered[swapIdx]] = [reordered[swapIdx], reordered[index]];
    persist(reordered);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a2744] text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Modern Roof</h1>
            <p className="text-blue-300 text-xs">Product Catalog</p>
          </div>
          <Link
            href="/"
            className="text-blue-300 hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Quote
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shingle Products</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage the products shown in the quote generator. Changes sync for everyone instantly.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-sm text-blue-500 font-medium">Saving…</span>
            )}
            {saved && !saving && (
              <span className="text-sm text-green-600 font-medium">✓ Saved for everyone</span>
            )}
            <button
              onClick={handleReset}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors font-medium ${
                confirmReset
                  ? "border-red-400 text-red-600 hover:bg-red-50"
                  : "border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {confirmReset ? "Confirm Reset" : "Reset to Defaults"}
            </button>
            {confirmReset && (
              <button
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
            )}
            {!isAdding && !editingId && (
              <button
                onClick={startAdd}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition-colors"
              >
                + Add Product
              </button>
            )}
          </div>
        </div>

        {/* Add / Edit Form */}
        {(isAdding || editingId) && (
          <div className="mb-8 bg-white border-2 border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {isAdding ? "Add New Product" : "Edit Product"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Field label="Product Name *">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. Tamco Impact Pro"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field label="Distributor *">
                <input
                  type="text"
                  value={form.distributor}
                  onChange={(e) => setField("distributor", e.target.value)}
                  placeholder="e.g. Tamco"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field label="Description / Features & Benefits" className="sm:col-span-2">
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={6}
                  placeholder={"e.g.\n• 130 mph wind resistance\n• Class 4 impact rating\n• Lifetime limited warranty\n• Available in 12 colors"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
                <p className="text-xs text-gray-400 mt-1">Use bullet points (•) to list features. This text appears on the customer-facing quote PDF.</p>
              </Field>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-3">
              Material Costs
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <NumField label="Cost / Bundle ($)" value={form.costPerBundle} onChange={(v) => setField("costPerBundle", v)} />
              <NumField label="Bundles / Square" value={form.bundlesPerSquare} onChange={(v) => setField("bundlesPerSquare", v)} step="1" />
              <NumField label="Hip & Ridge / Bundle ($)" value={form.hipRidgeCostPerBundle} onChange={(v) => setField("hipRidgeCostPerBundle", v)} />
              <NumField label="Starter / Bundle ($)" value={form.starterCostPerBundle} onChange={(v) => setField("starterCostPerBundle", v)} />
              <NumField label="Underlayment / Roll ($)" value={form.underlaymentCostPerRoll} onChange={(v) => setField("underlaymentCostPerRoll", v)} />
              <NumField label="Ice & Water / Roll ($)" value={form.iceWaterCostPerRoll} onChange={(v) => setField("iceWaterCostPerRoll", v)} />
              <NumField label="Ridge Vent / 4 ft ($)" value={form.ridgeVentCostPer4ft} onChange={(v) => setField("ridgeVentCostPer4ft", v)} />
              <NumField label="Pipe Jack Cost ($)" value={form.pipeJackCost} onChange={(v) => setField("pipeJackCost", v)} />
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-3 mt-2">
              Coverage Rates
            </h4>
            <p className="text-xs text-gray-400 mb-3">How much area or length each unit of this product covers — used to calculate quantities.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <NumField label="Hip & Ridge LF/Bundle" value={form.hipRidgeLfPerBundle ?? 31} onChange={(v) => setField("hipRidgeLfPerBundle", v)} step="1" />
              <NumField label="Starter LF/Bundle" value={form.starterLfPerBundle ?? 114} onChange={(v) => setField("starterLfPerBundle", v)} step="1" />
              <NumField label="Underlayment Sq/Roll" value={form.underlaymentSqPerRoll ?? 10} onChange={(v) => setField("underlaymentSqPerRoll", v)} step="0.1" />
              <NumField label="Ice & Water LF/Roll" value={form.iceWaterLfPerRoll ?? 66} onChange={(v) => setField("iceWaterLfPerRoll", v)} step="1" />
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-3">
              Included Upgrades
            </h4>
            <div className="flex gap-6 mb-6">
              <CheckField
                label="Lifetime Pipeboots Included"
                checked={form.includesPipeboots}
                onChange={(v) => setField("includesPipeboots", v)}
              />
              <CheckField
                label="Emerald Pro Warranty Included"
                checked={form.includesWarranty}
                onChange={(v) => setField("includesWarranty", v)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelForm}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveForm}
                disabled={!form.name.trim() || !form.distributor.trim()}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                  form.name.trim() && form.distributor.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isAdding ? "Add Product" : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* Product List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Loading products…</p>
          </div>
        ) : catalog.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium mb-2">No products yet</p>
            <p className="text-sm">Add a product or reset to defaults to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 mb-1">
              Use the ↑ ↓ arrows to set the order products appear in the quote — lowest quality at top, highest at bottom.
            </p>
            {catalog.map((product, index) => {
              const isDefault = DEFAULT_CATALOG.some((d) => d.id === product.id);
              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl border p-4 transition-colors flex gap-3 ${
                    editingId === product.id ? "border-blue-300" : "border-gray-200"
                  }`}
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0 pt-0.5">
                    <button
                      onClick={() => moveProduct(index, "up")}
                      disabled={index === 0}
                      title="Move up"
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveProduct(index, "down")}
                      disabled={index === catalog.length - 1}
                      title="Move down"
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Position badge */}
                  <div className="flex-shrink-0 w-6 text-center pt-1">
                    <span className="text-xs font-bold text-gray-300">{index + 1}</span>
                  </div>

                  {/* Product details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <span className="text-xs text-gray-400">{product.distributor}</span>
                          {isDefault && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">default</span>
                          )}
                          {product.includesPipeboots && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Pipeboots</span>
                          )}
                          {product.includesWarranty && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Warranty</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{product.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2">
                          <Stat label="Shingles" value={`$${product.costPerBundle}/bundle`} />
                          <Stat label="Bundles/sq" value={product.bundlesPerSquare} />
                          <Stat label="Hip & Ridge" value={`$${product.hipRidgeCostPerBundle}/bundle`} />
                          <Stat label="Starter" value={`$${product.starterCostPerBundle}/bundle`} />
                          <Stat label="Underlayment" value={`$${product.underlaymentCostPerRoll}/roll`} />
                          <Stat label="Ice & Water" value={`$${product.iceWaterCostPerRoll}/roll`} />
                          <Stat label="Ridge Vent" value={`$${product.ridgeVentCostPer4ft}/4ft`} />
                          <Stat label="Pipe Jack" value={`$${product.pipeJackCost}`} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => (editingId === product.id ? cancelForm() : startEdit(product))}
                          className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                        >
                          {editingId === product.id ? "Cancel" : "Edit"}
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="px-3 py-1.5 text-xs font-medium border border-red-100 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function NumField({ label, value, onChange, step = "0.01" }: { label: string; value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </Field>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="text-xs text-gray-500">
      <span className="text-gray-400">{label}: </span>
      {value}
    </span>
  );
}
