'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

const C = {
  gold: '#F5B800', dark: '#333', mid: '#555', muted: '#999',
  border: '#DDD', panel: '#F7F7F5', white: '#FFF',
  error: '#D93025',
};

const STATUSES = [
  { key: 'not_started', label: 'Not Started', color: '#92600A', bg: '#FFF9E6', border: '#FDE68A' },
  { key: 'in_process',  label: 'In Process',  color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  { key: 'complete',    label: 'Complete',     color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
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
    <div style={{ position: 'relative' }}>
      <div
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        style={{
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
          background: current.bg, color: current.color, border: `1px solid ${current.border}`,
          cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
        }}
      >
        {current.label} ▾
      </div>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 28, zIndex: 100,
          background: C.white, border: `1px solid ${C.border}`,
          borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          overflow: 'hidden', minWidth: 140,
        }}>
          {STATUSES.map(s => (
            <div key={s.key} onClick={e => { e.preventDefault(); e.stopPropagation(); update(s.key); }}
              style={{
                padding: '9px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                color: s.color, background: status === s.key ? s.bg : C.white,
                borderBottom: `1px solid ${C.border}`,
              }}>
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*, preproduction(id, submitted_at)')
        .order('created_at', { ascending: false });
      setJobs(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const updateStatus = (jobId, newStatus) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
  };

  const filtered = jobs.filter(j => {
    const matchSearch =
      j.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      j.id?.toLowerCase().includes(search.toLowerCase()) ||
      j.sales_rep?.toLowerCase().includes(search.toLowerCase()) ||
      j.address?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || j.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: jobs.length,
    not_started: jobs.filter(j => j.status === 'not_started').length,
    in_process:  jobs.filter(j => j.status === 'in_process').length,
    complete:    jobs.filter(j => j.status === 'complete').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.panel }}>
      {/* Header */}
      <div style={{ background: C.white, borderBottom: `3px solid ${C.gold}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: C.gold, color: '#111', fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', padding: '4px 9px', borderRadius: 3 }}>MODERN ROOF</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>Pre-Production</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/quote" style={{ fontSize: 13, fontWeight: 700, color: '#111', textDecoration: 'none', background: C.gold, padding: '7px 16px', borderRadius: 4 }}>
            + New Quote
          </Link>
          <Link href="/admin" style={{ fontSize: 12, color: C.muted, textDecoration: 'none', border: `1px solid ${C.border}`, padding: '6px 12px', borderRadius: 4, background: C.white }}>
            ⚙️ Admin
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>

        {/* Search */}
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by customer, job ID, rep, or address..."
          style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 14, background: C.white, outline: 'none', boxSizing: 'border-box' }}
        />

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {[
            { key: 'all',         label: 'All' },
            { key: 'not_started', label: 'Not Started' },
            { key: 'in_process',  label: 'In Process' },
            { key: 'complete',    label: 'Complete' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
              padding: '7px 16px', borderRadius: 20, border: `1px solid ${filter === tab.key ? C.gold : C.border}`,
              background: filter === tab.key ? C.gold : C.white,
              color: filter === tab.key ? '#111' : C.mid,
              fontWeight: filter === tab.key ? 700 : 400,
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {tab.label} <span style={{ opacity: 0.7 }}>({counts[tab.key]})</span>
            </button>
          ))}
        </div>

        {/* Job list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading jobs...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>No jobs found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(job => {
              const hasPreprod = job.preproduction?.length > 0;
              return (
                <Link key={job.id} href={`/job/${job.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: C.white, border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: C.dark, marginBottom: 3 }}>{job.customer_name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>
                        {job.address}{job.city ? `, ${job.city}` : ''}{job.sales_rep ? ` · Rep: ${job.sales_rep}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      {hasPreprod && (
                        <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>✓ Form Complete</span>
                      )}
                      <StatusBadge status={job.status || 'not_started'} jobId={job.id} onUpdate={updateStatus} />
                      <span style={{ color: C.muted, fontSize: 18 }}>›</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
