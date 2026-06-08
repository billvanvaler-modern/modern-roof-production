'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STATUSES = [
  { key: 'not_started', label: 'Not Started', pill: 'bg-amber-100 text-amber-800 border-amber-200', dot: '#92600A' },
  { key: 'in_process',  label: 'In Process',  pill: 'bg-blue-100  text-blue-800  border-blue-200',  dot: '#1D4ED8' },
  { key: 'complete',    label: 'Complete',     pill: 'bg-green-100 text-green-800 border-green-200', dot: '#16A34A' },
];

function StatusBadge({ status, jobId, onUpdate }) {
  const [open, setOpen] = useState(false);
  const current = STATUSES.find(s => s.key === status) || STATUSES[0];

  const update = async (key) => {
    setOpen(false);
    await supabase.from('jobs').update({ status: key }).eq('id', jobId);
    onUpdate(jobId, key);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
        className={`text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer select-none ${current.pill}`}
      >
        {current.label} ▾
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[148px]">
          {STATUSES.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); update(s.key); }}
              className={`w-full text-left px-4 py-2.5 text-xs font-semibold border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${s.key === status ? 'bg-gray-50' : ''}`}
              style={{ color: s.dot }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  customer_name: '', address: '', city: '', state: '', zip: '',
  phone: '', email: '', sales_rep: '',
};

const FILTER_TABS = [
  { key: 'all',         label: 'All' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'in_process',  label: 'In Process' },
  { key: 'complete',    label: 'Complete' },
];

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Add-job form
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function handlePdfFile(file) {
    if (!file || file.type !== 'application/pdf') {
      setUploadError('Please drop a PDF file.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const parseRes = await fetch('/api/parse-pdf', { method: 'POST', body: fd });
      const parseJson = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseJson.error || 'Parse failed');
      const m = parseJson.measurements;
      const wastePct = m.recommendedWastePct ?? 10;
      const squaresWithWaste =
        m.wasteTable?.[wastePct] ??
        Math.round((m.totalAreaSqft / 100) * (1 + wastePct / 100) * 10) / 10;
      const measurements = { ...m, wastePct, squaresWithWaste };
      const quoteRes = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: measurements.customerName,
          address: measurements.address,
          measurements,
        }),
      });
      const { id } = await quoteRes.json();
      router.push(`/quotes/${id}`);
    } catch {
      setUploadError('Could not read PDF. Make sure it is a Roofr report.');
      setUploading(false);
    }
  }

  useEffect(() => {
    supabase
      .from('jobs')
      .select('*, preproduction(id, submitted_at)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setJobs(data || []); setLoading(false); });
  }, []);

  const updateStatus = (jobId, newStatus) =>
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));

  async function addJob(e) {
    e.preventDefault();
    if (!form.customer_name.trim()) { setFormError('Customer name is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.customer_name.trim() || null,
          address:       form.address.trim()       || null,
          city:          form.city.trim()           || null,
          state:         form.state.trim()          || null,
          zip:           form.zip.trim()            || null,
          phone:         form.phone.trim()          || null,
          email:         form.email.trim()          || null,
          sales_rep:     form.sales_rep.trim()      || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError('Save failed: ' + (data.error || res.statusText)); setSaving(false); return; }
      setJobs(prev => [data, ...prev]);
      setForm(EMPTY_FORM);
      setShowAddForm(false);
    } catch (err) {
      setFormError('Save failed: ' + err.message);
    }
    setSaving(false);
  }

  function cancelAdd() {
    setShowAddForm(false);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  const setF = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      j.customer_name?.toLowerCase().includes(q) ||
      j.id?.toLowerCase().includes(q) ||
      j.sales_rep?.toLowerCase().includes(q) ||
      j.address?.toLowerCase().includes(q);
    return matchSearch && (filter === 'all' || j.status === filter);
  });

  const counts = {
    all:         jobs.length,
    not_started: jobs.filter(j => j.status === 'not_started').length,
    in_process:  jobs.filter(j => j.status === 'in_process').length,
    complete:    jobs.filter(j => j.status === 'complete').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-[#1a2744] text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Modern Roof</h1>
            <p className="text-blue-300 text-xs">Pre-Production</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowAddForm(v => !v); setFormError(''); }}
              className="text-blue-300 hover:text-white text-sm font-medium transition-colors border border-blue-400/40 hover:border-white/40 px-3 py-1.5 rounded-lg"
            >
              + Add Job
            </button>
            <Link
              href="/quote"
              className="bg-amber-400 hover:bg-amber-300 text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + New Quote
            </Link>
            <Link href="/admin" className="text-blue-300 hover:text-white text-sm transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Add Job Form ── */}
        {showAddForm && (
          <form
            onSubmit={addJob}
            className="bg-white border-2 border-blue-200 rounded-2xl p-6 mb-6 shadow-sm"
          >
            <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600 mb-4">
              Add Job Manually
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={e => setF('customer_name', e.target.value)}
                  placeholder="e.g. John & Jane Smith"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setF('address', e.target.value)}
                  placeholder="e.g. 123 Main St"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setF('city', e.target.value)}
                  placeholder="Indianapolis"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={e => setF('state', e.target.value)}
                    placeholder="IN"
                    maxLength={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Zip</label>
                  <input
                    type="text"
                    value={form.zip}
                    onChange={e => setF('zip', e.target.value)}
                    placeholder="46240"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setF('phone', e.target.value)}
                  placeholder="(317) 555-1234"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setF('email', e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sales Rep</label>
                <input
                  type="text"
                  value={form.sales_rep}
                  onChange={e => setF('sales_rep', e.target.value)}
                  placeholder="Rep name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {formError && (
              <p className="text-xs text-red-500 mb-3">{formError}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelAdd}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.customer_name.trim()}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                  !saving && form.customer_name.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? 'Saving…' : 'Add Job'}
              </button>
            </div>
          </form>
        )}

        {/* ── PDF Drop Zone ── */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfFile(f); e.target.value = ''; }}
        />
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handlePdfFile(e.dataTransfer.files?.[0]); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl px-5 py-4 mb-5 flex items-center gap-4 cursor-pointer transition-all ${
            dragOver ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <svg
            className={`w-7 h-7 flex-shrink-0 transition-colors ${dragOver ? 'text-amber-500' : 'text-gray-400'}`}
            fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="flex-1 min-w-0">
            {uploading ? (
              <p className="text-sm text-gray-500">Parsing Roofr report…</p>
            ) : (
              <p className="text-sm">
                <span className="font-semibold text-gray-800">Drop a Roofr PDF to start a new quote</span>
                <span className="text-gray-400 ml-2">or click to browse</span>
              </p>
            )}
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          </div>
        </div>

        {/* ── Search ── */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by customer, job ID, rep, or address…"
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* ── Filter tabs ── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === tab.key
                  ? 'bg-[#1a2744] text-white border-[#1a2744]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {tab.label} <span className="opacity-60">({counts[tab.key]})</span>
            </button>
          ))}
        </div>

        {/* ── Job list ── */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading jobs…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm mb-3">No jobs yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2"
            >
              + Add your first job manually
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(job => {
              const hasPreprod = job.preproduction?.length > 0;
              return (
                <Link key={job.id} href={`/job/${job.id}`} className="block">
                  <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center justify-between hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <div className="min-w-0 mr-3">
                      <p className="font-semibold text-gray-900 text-sm truncate">{job.customer_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {job.address}{job.city ? `, ${job.city}` : ''}{job.sales_rep ? ` · ${job.sales_rep}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {hasPreprod && (
                        <span className="text-xs text-green-600 font-semibold hidden sm:inline">✓ Form Complete</span>
                      )}
                      <StatusBadge
                        status={job.status || 'not_started'}
                        jobId={job.id}
                        onUpdate={updateStatus}
                      />
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
