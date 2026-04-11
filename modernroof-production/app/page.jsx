'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

const C = {
  gold: '#F5B800', dark: '#333', mid: '#555', muted: '#999',
  border: '#DDD', panel: '#F7F7F5', white: '#FFF', error: '#D93025',
  success: '#16A34A',
};

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*, preproduction(id, submitted_at, pdf_url)')
        .order('created_at', { ascending: false });
      setJobs(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = jobs.filter(j =>
    j.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    j.roofr_job_id?.toLowerCase().includes(search.toLowerCase()) ||
    j.sales_rep?.toLowerCase().includes(search.toLowerCase()) ||
    j.address?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (job) => {
    if (job.preproduction?.length > 0) return 'complete';
    return 'pending';
  };

  return (
    <div style={{ minHeight: '100vh', background: C.panel }}>
      {/* Header */}
      <div style={{ background: C.white, borderBottom: `3px solid ${C.gold}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: C.gold, color: '#111', fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', padding: '4px 9px', borderRadius: 3 }}>MODERN ROOF</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>Pre-Production</span>
        </div>
        <Link href="/admin" style={{ fontSize: 12, color: C.muted, textDecoration: 'none', border: `1px solid ${C.border}`, padding: '6px 12px', borderRadius: 4, background: C.white }}>
          ⚙️ Admin
        </Link>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        {/* Search */}
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by customer, job ID, rep, or address…"
          style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 20, background: C.white, outline: 'none' }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading jobs…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>No jobs found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(job => {
              const status = getStatus(job);
              return (
                <Link key={job.id} href={`/job/${job.roofr_job_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: C.white, border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer',
                    transition: 'box-shadow 0.15s',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: C.dark, marginBottom: 4 }}>{job.customer_name}</div>
                      <div style={{ fontSize: 13, color: C.muted }}>{job.address}{job.city ? `, ${job.city}` : ''} · Rep: {job.sales_rep} · {job.roofr_job_id}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                        background: status === 'complete' ? '#F0FDF4' : '#FFF9E6',
                        color: status === 'complete' ? C.success : '#92600A',
                        border: `1px solid ${status === 'complete' ? '#BBF7D0' : '#FDE68A'}`,
                      }}>
                        {status === 'complete' ? '✓ Complete' : '● Pending'}
                      </span>
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
