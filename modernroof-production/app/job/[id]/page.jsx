'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

const font = "'DM Sans', sans-serif";
const C = {
  gold: '#F5B800', goldDk: '#C99600',
  black: '#111', dark: '#333', mid: '#555', muted: '#999',
  border: '#DDD', panel: '#F7F7F5', white: '#FFF',
  error: '#D93025', errorBg: '#FFF0EF', lock: '#F0F0F0',
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const SHINGLES = {
  Malarkey: {
    'Legacy':         ['Weathered Wood','Driftwood','Onyx Black','Colonial Slate','Windsor Brown','Aged Oak','Black Oak'],
    'Vista':          ['Black Oak','Driftwood','Weathered Wood','Harvest Brown','Colonial Slate','Onyx Black','Brilliant Black'],
    'Windsor':        ['Antique Pewter','Cambridge Gray','Colonial Slate','Onyx Black','Weathered Wood'],
    'Highlander':     ['Aged Oak','Driftwood','Weathered Wood','Onyx Black','Colonial Slate','Cambridge Gray','Brilliant Black'],
    'Highlander NEX': ['Aged Oak','Driftwood','Weathered Wood','Onyx Black','Colonial Slate','Cambridge Gray'],
    'Ecoasis':        ['Weathered Wood','Driftwood','Onyx Black','Aged Oak'],
  },
  Atlas: {
    'StormMaster Shake': ['Oyster Gray','Charcoal Black','Fox Hollow Gray','Mission Brown','Barkwood'],
    'StormMaster Slate': ['Antique Silver','Charcoal Black','Oyster Gray','Weathered Wood'],
    'Pinnacle Pristine': ['Hearthstone','Barkwood','Charcoal Black','Fox Hollow Gray','Mission Brown','Oyster Gray'],
  },
};
const HIP_RIDGE   = ['Regular','Upgraded','Malarkey Windsor Hip & Ridge','Atlas ProCut'];
const DRIP_COLORS = ['White','Brown','Wicker','Gray','Black','Galvanized','Aluminum'];
const WARRANTY    = ['Standard','Upgraded — Emerald Pro (Malarkey)','Upgraded — Pinnacle Pristine (Atlas)'];
const VENT_TYPES  = ['Ridge','Box Vents','Ridge + Box Vents','Power Vent','Soffit Only','None'];
const BOX_COLORS  = ['Black','Brown','White','Gray','Weathered Wood'];
const GUT_COLORS  = ['White','Almond','Wicker','Brown','Bronze','Gray','Musket Brown','Black'];
const GUT_SIZES   = ['5" K-Style','6" K-Style','4" Box','5" Box'];
const GUARD_TYPES = ['Micro-Mesh','Reverse Curve','Foam Insert','Screen'];
const SID_STYLES  = ['D4','D5','Double 4 Dutch Lap','Board & Batten','Shake'];
const SID_BRANDS  = ['CertainTeed','James Hardie','LP SmartSide','Mastic','Alside'];
const SID_COLORS  = ['Autumn Red','Beige','Clay','Colonial Yellow','Cypress','Linen','Midnight Surf','Navajo White','Pewter','Sandstone','Tuscan Olive'];
const SF_MATS     = ['Aluminum','Vinyl','Wood','Hardie'];
const SF_COLORS   = ['White','Almond','Brown','Bronze','Gray','Musket Brown','Black','Wicker'];
const SOF_WIDTHS  = ['8"','10"','12"','16"','20"','24"'];
const FAS_HEIGHTS = ['4"','5"','6"','8"'];

// ─── Base styles ──────────────────────────────────────────────────────────────
const inputCss = {
  width: '100%', background: C.white, border: `1px solid ${C.border}`,
  borderRadius: 4, color: C.dark, padding: '9px 12px',
  fontSize: 14, fontFamily: font, boxSizing: 'border-box', outline: 'none',
};
const lockedCss = { ...inputCss, background: C.lock, color: C.muted, cursor: 'not-allowed' };

// ─── UI Components ─────────────────────────────────────────────────────────────
function Lbl({ children, required, error }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5, color: error ? C.error : C.mid, fontFamily: font }}>
      {children}{required && <span style={{ color: C.error }}> *</span>}
    </div>
  );
}
function F({ label, required, error, children, span2 }) {
  return (
    <div style={{ marginBottom: 14, gridColumn: span2 ? '1 / -1' : undefined }}>
      {label && <Lbl required={required} error={!!error}>{label}</Lbl>}
      {children}
      {error && <div style={{ fontSize: 11, color: C.error, marginTop: 3 }}>{error}</div>}
    </div>
  );
}
function CField({ label, required, error, value, onChange, options, locked, lockedHint }) {
  const [ov, setOv] = useState('');
  if (locked) return (
    <F label={label} required={required}>
      <select disabled style={{ ...lockedCss, appearance: 'none' }}>
        <option>{lockedHint || 'Select above first…'}</option>
      </select>
    </F>
  );
  return (
    <F label={label} required={required} error={error}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputCss, appearance: 'none', cursor: 'pointer', color: value ? C.dark : C.muted }}>
        <option value=''>Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        <option value='__other__'>Other (specify below)</option>
      </select>
      {value === '__other__' && (
        <input type='text' value={ov} placeholder='Specify other…'
          onChange={e => { setOv(e.target.value); onChange('__other__:' + e.target.value); }}
          style={{ ...inputCss, marginTop: 6 }} />
      )}
    </F>
  );
}
function PField({ label, required, error, value, onChange, options }) {
  return (
    <F label={label} required={required} error={error}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputCss, appearance: 'none', cursor: 'pointer', color: value ? C.dark : C.muted }}>
        <option value=''>Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </F>
  );
}
function NumField({ label, required, error, value, onChange }) {
  return (
    <F label={label} required={required} error={error}>
      <input type='number' min='0' value={value} placeholder='0' onChange={e => onChange(e.target.value)} style={inputCss} />
    </F>
  );
}
function TxtField({ label, required, error, value, onChange, placeholder, rows, span2 }) {
  return (
    <F label={label} required={required} error={error} span2={span2}>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows || 2}
        style={{ ...inputCss, resize: 'vertical', lineHeight: 1.6 }} />
    </F>
  );
}
function TxtInput({ label, required, error, value, onChange, placeholder, span2 }) {
  return (
    <F label={label} required={required} error={error} span2={span2}>
      <input type='text' value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputCss} />
    </F>
  );
}
function YN({ label, required, error, value, onChange }) {
  return (
    <F label={label} required={required} error={error}>
      <div style={{ display: 'flex', gap: 8 }}>
        {['Yes','No'].map(opt => (
          <button key={opt} onClick={() => onChange(opt)} type='button' style={{
            flex: 1, padding: '9px 0', border: `1px solid ${value === opt ? C.gold : C.border}`,
            borderRadius: 4, background: value === opt ? C.gold : C.white,
            color: value === opt ? C.black : C.mid, fontWeight: value === opt ? 700 : 400,
            cursor: 'pointer', fontSize: 14, fontFamily: font, transition: 'all 0.12s',
          }}>{opt}</button>
        ))}
      </div>
    </F>
  );
}
function SecHead({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${C.gold}`, paddingLeft: 12, marginBottom: 16 }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.dark, fontFamily: font }}>{title}</h3>
    </div>
  );
}
function Divider() { return <div style={{ borderTop: `1px solid ${C.border}`, margin: '18px 0' }} />; }
function Card({ children, errorBorder, title, icon }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${errorBorder ? C.error : C.border}`, borderRadius: 8, padding: 22, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {(title || icon) && <SecHead icon={icon} title={title} />}
      {children}
    </div>
  );
}
function Grid({ cols, children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols || 2}, 1fr)`, gap: '0 16px' }}>{children}</div>;
}
function ScopeBtn({ label, icon, on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      flex: 1, minWidth: 90, border: `2px solid ${on ? C.gold : C.border}`, borderRadius: 6,
      padding: '12px 8px', cursor: 'pointer', background: on ? '#FFFBEE' : C.panel,
      textAlign: 'center', userSelect: 'none', transition: 'all 0.12s',
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: on ? C.goldDk : C.muted, fontFamily: font }}>{label}</div>
      {on && <div style={{ marginTop: 3, color: C.gold, fontSize: 12 }}>✓</div>}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
function PreProductionForm({ job, existing }) {
  const ex = existing || {};
  const [scope, setScope] = useState({ roof: ex.scope_roof||false, gutters: ex.scope_gutters||false, siding: ex.scope_siding||false, windows: ex.scope_windows||false, sf: ex.scope_sf||false });
  const [roof, setRoof] = useState({ brand: ex.shingle_brand||'', model: ex.shingle_type||'', color: ex.shingle_color||'', hipRidge: ex.hip_ridge||'', dripEdge: ex.drip_edge_color||'', warranty: ex.warranty||'', layers: ex.existing_layers||'', osb: ex.osb_sheets?.toString()||'', pj1: ex.pj_1in?.toString()||'', pj2: ex.pj_2in?.toString()||'', pj3: ex.pj_3in?.toString()||'', pj4: ex.pj_4in?.toString()||'', splitBoots: ex.split_boots?.toString()||'', upgradedBoots: ex.upgraded_boots ? 'Yes' : '', existingVent: ex.existing_vent||'', replVent: ex.replacement_vent||'', quarrixPlugs: ex.quarrix_plugs?.toString()||'', boxVentCount: ex.box_vent_count?.toString()||'', boxVentColor: ex.box_vent_color||'', materialSpot: ex.material_spot||'', dumpTrailer: ex.dump_trailer||'', notes: ex.roof_notes||'' });
  const [gutters, setGutters] = useState({ color: ex.gutter_color||'', size: ex.gutter_size||'', guards: ex.gutter_guards ? 'Yes' : '', guardType: ex.guard_type||'', notes: ex.gutter_notes||'' });
  const [siding, setSiding] = useState({ style: ex.siding_style||'', brand: ex.siding_brand||'', typeLine: ex.siding_type_line||'', color: ex.siding_color||'', notes: ex.siding_notes||'' });
  const [windows, setWindows] = useState({ notes: ex.window_notes||'' });
  const [sf, setSf] = useState({ material: ex.sf_material||'', color: ex.sf_color||'', soffitWidth: ex.soffit_width||'', vented: ex.soffit_vented ? 'Yes' : '', fasciaHeight: ex.fascia_height||'', notes: ex.sf_notes||'' });
  const [otherNotes, setOtherNotes] = useState(ex.overall_notes||'');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const modelList = roof.brand && !roof.brand.startsWith('__other__') ? Object.keys(SHINGLES[roof.brand] || {}) : [];
  const colorList = roof.brand && !roof.brand.startsWith('__other__') && roof.model && !roof.model.startsWith('__other__') ? (SHINGLES[roof.brand]?.[roof.model] || []) : [];
  const existingHasBox = roof.existingVent === 'Box Vents' || roof.existingVent === 'Ridge + Box Vents';
  const replHasBox = roof.replVent === 'Box Vents' || roof.replVent === 'Ridge + Box Vents';
  const showQuarrix = existingHasBox && !replHasBox && roof.replVent !== '';
  const showBoxFields = replHasBox;
  const noScope = !scope.roof && !scope.gutters && !scope.siding && !scope.windows && !scope.sf;

  const validate = () => {
    const e = {};
    if (noScope) e.scope = 'Select at least one scope item.';
    if (scope.roof) {
      if (!roof.brand) e['roof.brand'] = 'Required';
      if (!roof.model) e['roof.model'] = 'Required';
      if (!roof.color) e['roof.color'] = 'Required';
      if (!roof.hipRidge) e['roof.hipRidge'] = 'Required';
      if (!roof.dripEdge) e['roof.dripEdge'] = 'Required';
      if (!roof.warranty) e['roof.warranty'] = 'Required';
      if (!roof.layers) e['roof.layers'] = 'Required';
      if (!roof.osb) e['roof.osb'] = 'Required';
      if (!roof.existingVent) e['roof.existVent'] = 'Required';
      if (!roof.replVent) e['roof.replVent'] = 'Required';
      if (!roof.materialSpot) e['roof.mat'] = 'Required';
      if (!roof.dumpTrailer) e['roof.dump'] = 'Required';
    }
    if (scope.gutters) {
      if (!gutters.color) e['gut.color'] = 'Required';
      if (!gutters.size) e['gut.size'] = 'Required';
      if (!gutters.guards) e['gut.guards'] = 'Required';
    }
    if (scope.siding) {
      if (!siding.brand) e['sid.brand'] = 'Required';
      if (!siding.typeLine) e['sid.typeLine'] = 'Required';
      if (!siding.style) e['sid.style'] = 'Required';
      if (!siding.color) e['sid.color'] = 'Required';
    }
    if (scope.sf) {
      if (!sf.material) e['sf.material'] = 'Required';
      if (!sf.color) e['sf.color'] = 'Required';
      if (!sf.soffitWidth) e['sf.width'] = 'Required';
      if (!sf.vented) e['sf.vented'] = 'Required';
      if (!sf.fasciaHeight) e['sf.height'] = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    // First delete any existing record for this job
    await supabase.from('preproduction').delete().eq('job_id', job.roofr_job_id);

    const payload = {
      job_id: job.roofr_job_id,
      scope_roof: scope.roof, scope_gutters: scope.gutters, scope_siding: scope.siding, scope_windows: scope.windows, scope_sf: scope.sf,
      shingle_brand: roof.brand || null, shingle_type: roof.model || null, shingle_color: roof.color || null,
      hip_ridge: roof.hipRidge || null, drip_edge_color: roof.dripEdge || null, warranty: roof.warranty || null,
      existing_layers: roof.layers || null,
      osb_sheets: roof.osb ? parseInt(roof.osb) : null,
      pj_1in: parseInt(roof.pj1)||0, pj_2in: parseInt(roof.pj2)||0, pj_3in: parseInt(roof.pj3)||0, pj_4in: parseInt(roof.pj4)||0,
      split_boots: parseInt(roof.splitBoots)||0, upgraded_boots: roof.upgradedBoots === 'Yes',
      existing_vent: roof.existingVent || null, replacement_vent: roof.replVent || null,
      quarrix_plugs: parseInt(roof.quarrixPlugs)||0, box_vent_count: parseInt(roof.boxVentCount)||0,
      box_vent_color: roof.boxVentColor || null,
      material_spot: roof.materialSpot || null, dump_trailer: roof.dumpTrailer || null, roof_notes: roof.notes || null,
      gutter_color: gutters.color || null, gutter_size: gutters.size || null,
      gutter_guards: gutters.guards === 'Yes', guard_type: gutters.guardType || null, gutter_notes: gutters.notes || null,
      siding_brand: siding.brand || null, siding_type_line: siding.typeLine || null,
      siding_style: siding.style || null, siding_color: siding.color || null, siding_notes: siding.notes || null,
      sf_material: sf.material || null, sf_color: sf.color || null, soffit_width: sf.soffitWidth || null,
      soffit_vented: sf.vented === 'Yes', fascia_height: sf.fasciaHeight || null, sf_notes: sf.notes || null,
      window_notes: windows.notes || null, overall_notes: otherNotes || null,
    };

    const { error } = await supabase.from('preproduction').insert(payload);
    setSaving(false);
    if (error) {
      alert('Save failed: ' + error.message);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: C.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: C.dark }}>Pre-Production Submitted</h2>
        <p style={{ color: C.muted, lineHeight: 1.7, margin: '0 0 20px', fontSize: 13 }}>
          Job <strong style={{ color: C.dark }}>{job.roofr_job_id}</strong> for <strong style={{ color: C.dark }}>{job.customer_name}</strong> has been saved.
        </p>
        <button onClick={() => setSubmitted(false)} style={{ background: C.white, border: `1px solid ${C.border}`, color: C.dark, padding: '10px 24px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontFamily: font }}>← Edit Form</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.panel, fontFamily: font }}>
      {/* Header */}
      <div style={{ background: C.white, borderBottom: `3px solid ${C.gold}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: C.gold, color: C.black, fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', padding: '4px 9px', borderRadius: 3 }}>MODERN ROOF</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>Pre-Production Form</span>
        </div>
        <div style={{ fontSize: 12, color: C.muted, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: '6px 12px' }}>
          Job: <strong style={{ color: C.dark }}>{job.roofr_job_id}</strong>
        </div>
      </div>

      <div style={{ maxWidth: 740, margin: '0 auto', padding: '22px 16px 60px' }}>
        {/* Job Info */}
        <Card title='Job Information' icon='📋'>
          <Grid cols={2}>
            {[['Customer', job.customer_name],['Sales Rep', job.sales_rep],['Phone', job.phone],['Email', job.email],['Address', job.address],['City / State / Zip', `${job.city}, ${job.state} ${job.zip}`]].map(([lbl, val]) => (
              <div key={lbl} style={{ marginBottom: 12 }}>
                <Lbl>{lbl}</Lbl>
                <div style={{ ...inputCss, background: C.panel, color: C.mid, cursor: 'default' }}>{val}</div>
              </div>
            ))}
          </Grid>
        </Card>

        {/* Scope */}
        <Card errorBorder={!!errors.scope} title='Scope of Work' icon='🔍'>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ScopeBtn label='Roof'          icon='🏠' on={scope.roof}    onChange={v => setScope(s => ({ ...s, roof: v }))} />
            <ScopeBtn label='Gutters'       icon='💧' on={scope.gutters} onChange={v => setScope(s => ({ ...s, gutters: v }))} />
            <ScopeBtn label='Siding'        icon='🧱' on={scope.siding}  onChange={v => setScope(s => ({ ...s, siding: v }))} />
            <ScopeBtn label='Windows'       icon='🪟' on={scope.windows} onChange={v => setScope(s => ({ ...s, windows: v }))} />
            <ScopeBtn label='Soffit/Fascia' icon='🏗️' on={scope.sf}      onChange={v => setScope(s => ({ ...s, sf: v }))} />
          </div>
          {errors.scope && <div style={{ marginTop: 10, fontSize: 12, color: C.error }}>{errors.scope}</div>}
        </Card>

        {/* ROOF */}
        {scope.roof && (
          <Card title='Roofing Details' icon='🏠'>
            <Grid cols={2}>
              <CField label='Shingle Manufacturer' required value={roof.brand} error={errors['roof.brand']} options={Object.keys(SHINGLES)} onChange={v => setRoof(r => ({ ...r, brand: v, model: '', color: '' }))} />
              <CField label='Shingle Type' required value={roof.model} error={errors['roof.model']} options={modelList} locked={!roof.brand || roof.brand.startsWith('__other__')} lockedHint='Select manufacturer first…' onChange={v => setRoof(r => ({ ...r, model: v, color: '' }))} />
              <CField label='Shingle Color' required value={roof.color} error={errors['roof.color']} options={colorList} locked={!roof.model || roof.model.startsWith('__other__')} lockedHint='Select type first…' onChange={v => setRoof(r => ({ ...r, color: v }))} />
              <PField label='Hip and Ridge Type' required value={roof.hipRidge} error={errors['roof.hipRidge']} options={HIP_RIDGE} onChange={v => setRoof(r => ({ ...r, hipRidge: v }))} />
              <CField label='Drip Edge / Gutter Apron Color' required value={roof.dripEdge} error={errors['roof.dripEdge']} options={DRIP_COLORS} onChange={v => setRoof(r => ({ ...r, dripEdge: v }))} />
              <PField label='Warranty' required value={roof.warranty} error={errors['roof.warranty']} options={WARRANTY} onChange={v => setRoof(r => ({ ...r, warranty: v }))} />
              <PField label='Existing Layers' required value={roof.layers} error={errors['roof.layers']} options={['1 Layer','2 Layers','3+ Layers']} onChange={v => setRoof(r => ({ ...r, layers: v }))} />
              <NumField label='# of Sheets of OSB to Order' required value={roof.osb} error={errors['roof.osb']} onChange={v => setRoof(r => ({ ...r, osb: v }))} />
            </Grid>
            <Divider />
            <SecHead icon='🔩' title='Pipejacks' />
            <Grid cols={3}>
              <NumField label='# of 1" Pipejacks' value={roof.pj1} onChange={v => setRoof(r => ({ ...r, pj1: v }))} />
              <NumField label='# of 2" Pipejacks' value={roof.pj2} onChange={v => setRoof(r => ({ ...r, pj2: v }))} />
              <NumField label='# of 3" Pipejacks' value={roof.pj3} onChange={v => setRoof(r => ({ ...r, pj3: v }))} />
              <NumField label='# of 4" Pipejacks' value={roof.pj4} onChange={v => setRoof(r => ({ ...r, pj4: v }))} />
              <NumField label='# of Split Boots' value={roof.splitBoots} onChange={v => setRoof(r => ({ ...r, splitBoots: v }))} />
              <YN label='Upgraded Pipe Boots?' value={roof.upgradedBoots} onChange={v => setRoof(r => ({ ...r, upgradedBoots: v }))} />
            </Grid>
            <Divider />
            <SecHead icon='🌬️' title='Ventilation' />
            <Grid cols={2}>
              <PField label='Existing Ventilation' required value={roof.existingVent} error={errors['roof.existVent']} options={VENT_TYPES} onChange={v => setRoof(r => ({ ...r, existingVent: v, quarrixPlugs: '' }))} />
              <PField label='Replacement Ventilation' required value={roof.replVent} error={errors['roof.replVent']} options={VENT_TYPES} onChange={v => setRoof(r => ({ ...r, replVent: v, boxVentCount: '', boxVentColor: '' }))} />
              {showQuarrix && <NumField label='# of Quarrix Plugs Needed' value={roof.quarrixPlugs} onChange={v => setRoof(r => ({ ...r, quarrixPlugs: v }))} />}
              {showBoxFields && <>
                <NumField label='# of Box Vents to Order' value={roof.boxVentCount} onChange={v => setRoof(r => ({ ...r, boxVentCount: v }))} />
                <PField label='Box Vent Color' value={roof.boxVentColor} options={BOX_COLORS} onChange={v => setRoof(r => ({ ...r, boxVentColor: v }))} />
              </>}
            </Grid>
            <Divider />
            <SecHead icon='📦' title='Logistics' />
            <Grid cols={2}>
              <TxtInput label='Material Placement' required value={roof.materialSpot} error={errors['roof.mat']} onChange={v => setRoof(r => ({ ...r, materialSpot: v }))} placeholder='e.g. Driveway, side yard left…' />
              <TxtInput label='Dump Trailer Placement' required value={roof.dumpTrailer} error={errors['roof.dump']} onChange={v => setRoof(r => ({ ...r, dumpTrailer: v }))} placeholder='e.g. Driveway, street…' />
            </Grid>
            <TxtField label='Roof Notes' value={roof.notes} onChange={v => setRoof(r => ({ ...r, notes: v }))} placeholder='Anything production needs to know…' span2 />
          </Card>
        )}

        {/* GUTTERS */}
        {scope.gutters && (
          <Card title='Gutter Details' icon='💧'>
            <Grid cols={2}>
              <CField label='Gutter Color' required value={gutters.color} error={errors['gut.color']} options={GUT_COLORS} onChange={v => setGutters(g => ({ ...g, color: v }))} />
              <PField label='Gutter Size' required value={gutters.size} error={errors['gut.size']} options={GUT_SIZES} onChange={v => setGutters(g => ({ ...g, size: v }))} />
              <YN label='Gutter Guards?' required value={gutters.guards} error={errors['gut.guards']} onChange={v => setGutters(g => ({ ...g, guards: v, guardType: '' }))} />
              {gutters.guards === 'Yes' && <PField label='Guard Type' value={gutters.guardType} options={GUARD_TYPES} onChange={v => setGutters(g => ({ ...g, guardType: v }))} />}
            </Grid>
            <TxtField label='Gutter Notes' value={gutters.notes} onChange={v => setGutters(g => ({ ...g, notes: v }))} placeholder='Anything production needs to know…' span2 />
          </Card>
        )}

        {/* SIDING */}
        {scope.siding && (
          <Card title='Siding Details' icon='🧱'>
            <Grid cols={2}>
              <CField label='Siding Manufacturer' required value={siding.brand} error={errors['sid.brand']} options={SID_BRANDS} onChange={v => setSiding(s => ({ ...s, brand: v }))} />
              <TxtInput label='Type / Product Line' required value={siding.typeLine} error={errors['sid.typeLine']} onChange={v => setSiding(s => ({ ...s, typeLine: v }))} placeholder='e.g. Monogram 46, HardiePlank…' />
              <CField label='Siding Style' required value={siding.style} error={errors['sid.style']} options={SID_STYLES} onChange={v => setSiding(s => ({ ...s, style: v }))} />
              <CField label='Siding Color' required value={siding.color} error={errors['sid.color']} options={SID_COLORS} onChange={v => setSiding(s => ({ ...s, color: v }))} />
            </Grid>
            <TxtField label='Siding Notes' value={siding.notes} onChange={v => setSiding(s => ({ ...s, notes: v }))} placeholder='Anything production needs to know…' span2 />
          </Card>
        )}

        {/* SOFFIT & FASCIA */}
        {scope.sf && (
          <Card title='Soffit & Fascia' icon='🏗️'>
            <Grid cols={2}>
              <CField label='Material' required value={sf.material} error={errors['sf.material']} options={SF_MATS} onChange={v => setSf(s => ({ ...s, material: v }))} />
              <CField label='Color' required value={sf.color} error={errors['sf.color']} options={SF_COLORS} onChange={v => setSf(s => ({ ...s, color: v }))} />
              <PField label='Soffit Width' required value={sf.soffitWidth} error={errors['sf.width']} options={SOF_WIDTHS} onChange={v => setSf(s => ({ ...s, soffitWidth: v }))} />
              <YN label='Vented Soffit?' required value={sf.vented} error={errors['sf.vented']} onChange={v => setSf(s => ({ ...s, vented: v }))} />
              <PField label='Fascia Height' required value={sf.fasciaHeight} error={errors['sf.height']} options={FAS_HEIGHTS} onChange={v => setSf(s => ({ ...s, fasciaHeight: v }))} />
            </Grid>
            <TxtField label='Soffit & Fascia Notes' value={sf.notes} onChange={v => setSf(s => ({ ...s, notes: v }))} placeholder='Anything production needs to know…' span2 />
          </Card>
        )}

        {/* WINDOWS */}
        {scope.windows && (
          <Card title='Window Details' icon='🪟'>
            <TxtField label='Window Notes' value={windows.notes} onChange={v => setWindows(w => ({ ...w, notes: v }))} placeholder='Style, size, count, color…' rows={3} span2 />
          </Card>
        )}

        {/* Overall Notes */}
        <Card>
          <TxtField label='Overall Job Notes' value={otherNotes} onChange={setOtherNotes} placeholder='General notes about this job that production needs to know…' rows={3} span2 />
        </Card>

        {/* Submit */}
        {!noScope && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            {Object.keys(errors).length > 0 && (
              <div style={{ padding: '10px 16px', background: C.errorBg, border: `1px solid ${C.error}`, borderRadius: 4, fontSize: 12, color: C.error }}>
                Please complete all required fields before submitting.
              </div>
            )}
            <button onClick={handleSubmit} disabled={saving} style={{
              background: C.gold, color: C.black, border: 'none', padding: '13px 40px',
              borderRadius: 4, fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
              fontFamily: font, boxShadow: '0 2px 6px rgba(245,184,0,0.35)',
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving…' : 'Submit Pre-Production →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function JobPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: jobData } = await supabase.from('jobs').select('*').eq('roofr_job_id', id).single();
      if (!jobData) { setNotFound(true); setLoading(false); return; }
      setJob(jobData);

      const { data: preprod } = await supabase.from('preproduction').select('*').eq('job_id', id).single();
      if (preprod) setExisting(preprod);

      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, color: C.muted }}>Loading job…</div>;
  if (notFound) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, color: C.muted }}>Job not found: {id}</div>;

  return <PreProductionForm job={job} existing={existing} />;
}
