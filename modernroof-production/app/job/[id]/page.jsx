'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

const font = "'DM Sans', sans-serif";
const C = { gold: '#F5B800', dark: '#333', muted: '#999', border: '#DDD', panel: '#F7F7F5', white: '#FFF' };

export default function JobPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('roofr_job_id', id)
        .single();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setJob(data);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, color: C.muted }}>Loading job…</div>;
  if (notFound) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, color: C.muted }}>Job not found: {id}</div>;

  return (
    <div style={{ minHeight: '100vh', background: C.panel, fontFamily: font }}>
      <div style={{ background: C.white, borderBottom: `3px solid ${C.gold}`, padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ background: C.gold, color: '#111', fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', padding: '4px 9px', borderRadius: 3 }}>MODERN ROOF</div>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>Pre-Production — {job.customer_name}</span>
      </div>
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center', color: C.muted, fontSize: 14 }}>
          Form loading for job {job.roofr_job_id}
        </div>
      </div>
    </div>
  );
}
