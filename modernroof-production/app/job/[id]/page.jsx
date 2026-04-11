'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import JobForm from '../../../components/JobForm';

export default function JobPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('roofr_job_id', id)
        .single();

      if (!jobData) { setNotFound(true); setLoading(false); return; }
      setJob(jobData);

      const { data: preprod } = await supabase
        .from('preproduction')
        .select('*')
        .eq('job_id', id)
        .single();

      setExisting(preprod || null);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', color: '#999' }}>
      Loading job…
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', color: '#999' }}>
      Job not found: {id}
    </div>
  );

  return <JobForm job={job} existing={existing} />;
}
