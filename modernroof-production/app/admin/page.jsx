'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

const C = {
  gold: '#F5B800', goldDk: '#C99600',
  black: '#111', dark: '#333', mid: '#555', muted: '#999',
  border: '#DDD', panel: '#F7F7F5', white: '#FFF',
  error: '#D93025', errorBg: '#FFF0EF',
  success: '#16A34A', successBg: '#F0FDF4',
};

const CATS = [
  { key: 'shingle_brand',   label: 'Shingle Brands',            hasParent: false },
  { key: 'shingle_type',    label: 'Shingle Types',             hasParent: true, parentCat: 'shingle_brand' },
  { key: 'shingle_color',   label: 'Shingle Colors',            hasParent: true, parentCat: 'shingle_type' },
  { key: 'drip_edge_color', label: 'Drip Edge Colors',          hasParent: false },
  { key: 'hip_ridge',       label: 'Hip & Ridge Types',         hasParent: false },
  { key: 'warranty',        label: 'Warranty Types',            hasParent: false },
  { key: 'gutter_color',    label: 'Gutter Colors',             hasParent: false },
  { key: 'gutter_size',     label: 'Gutter Sizes',              hasParent: false },
  { key: 'guard_type',      label: 'Guard Types',               hasParent: false },
  { key: 'box_vent_color',  label: 'Box Vent Colors',           hasParent: false },
  { key: 'siding_brand',    label: 'Siding Brands',             hasParent: false },
  { key: 'siding_style',    label: 'Siding Styles',             hasParent: false },
  { key: 'sf_material',     label: 'Soffit & Fascia Materials', hasParent: false },
  { key: 'sf_color',        label: 'Soffit & Fascia Colors',    hasParent: false },
  { key: 'soffit_width',    label: 'Soffit Widths',             hasParent: false },
  { key: 'fascia_height',   label: 'Fascia Heights',            hasParent: false },
];

export default function AdminPage() {
  const [activeCat, setActiveCat] = useState(CATS[0].key);
  const [items, setItems]         = useState([]);
  const [parents, setParents]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [newValue, setNewValue]   = useState('');
  const [newParent, setNewParent] = useState('');
  const [editId, setEditId]       = useState(null);
  const [editVal, setEditVal]     = useState('');

  const cat = CATS.find(c => c.key === activeCat);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('materials').select('*').eq('category', activeCat).order('sort_order');
    if (error) showToast('Failed to load', 'error');
    else setItems(data || []);
    setLoading(false);
  }, [activeCat]);

  const loadParents = useCallback(async () => {
    if (!cat.hasParent) { setParents([]); return; }
    const { data } = await supabase.from('materials').select('*').eq('category', cat.parentCat).eq('active', true).order('sort_order');
    setParents(data || []);
    if (data?.length) setNewParent(data[0].value);
  }, [activeCat]);

  useEffect(() => { setNewValue(''); setEditId(null); load(); loadParents(); }, [activeCat]);

  const addItem = async () => {
    if (!newValue.trim()) return;
    const maxOrder = items.length ? Math.max(...items.map(i => i.sort_order)) + 1 : 1;
    const { error } = await supabase.from('materials').insert({ category: activeCat, value: newValue.trim(), parent: cat.hasParent ? newParent : null, sort_order: maxOrder, active: true });
    if (error) showToast('Failed to add', 'error');
    else { showToast(`"${newValue.trim()}" added`); setNewValue(''); load(); }
  };

  const toggleActive = async (item) => {
    const { error } = await supabase.from('materials').update({ active: !item.active }).eq('id', item.id);
    if (error) showToast('Failed', 'error');
    else { showToast(item.active ? 'Hidden' : 'Restored'); load(); }
  };

  const saveEdit = async () => {
    if (!editVal.trim()) return;
    const { error } = await supabase.from('materials').update({ value: editVal.trim() }).eq('id', editId);
    if (error) showToast('Failed', 'error');
    else { showToast('Saved'); setEditId(null); load(); }
  };

  const deleteItem = async (item) => {
    if (!confirm(`Delete "${item.value}"?`)) return;
    const { error } = await supabase.from('materials').delete().eq('id', item.id);
    if (error) showToast('Failed', 'error');
    else { showToast('Deleted'); load(); }
  };

  const move = async (item, dir) => {
    const active = items.filter(i => i.active);
    const idx = active.findIndex(i => i.id === item.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= active.length) return;
    const swap = active[swapIdx];
    await supabase.from('materials').update({ sort_order: swap.sort_order }).eq('id', item.id);
    await supabase.from('materials').update({ sort_order: item.sort_order }).eq('id', swap.id);
    load();
  };

  const activeItems   = items.filter(i => i.active);
  const inactiveItems = items.filter(i => !i.active);

  const inputStyle = { width: '100%', padding: '8px 11px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 4, outline: 'none', fontFamily: 'inherit' };

  return (
    <div style={{ minHeight: '100vh', background: C.panel }}>
      <div style={{ background: C.white, borderBottom: `3px solid ${C.gold}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: C.gold, color: '#111', fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', padding: '4px 9px', borderRadius: 3 }}>MODERN ROOF</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>Materials Admin</span>
        </div>
        <Link href="/" style={{ fontSize: 12, color: C.muted, textDecoration: 'none', border: `1px solid ${C.border}`, padding: '6px 12px', borderRadius: 4, background: C.white }}>← Jobs</Link>
      </div>

      <div style={{ display: 'flex', maxWidth: 960, margin: '0 auto', padding: '24px 16px', gap: 20 }}>
        {/* Sidebar */}
        <div style={{ width: 210, flexShrink: 0 }}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {CATS.map((c, i) => (
              <div key={c.key} onClick={() => setActiveCat(c.key)} style={{ padding: '11px 14px', cursor: 'pointer', fontSize: 13, fontWeight: activeCat === c.key ? 700 : 400, color: activeCat === c.key ? C.black : C.mid, background: activeCat === c.key ? '#FFFBEE' : C.white, borderLeft: `3px solid ${activeCat === c.key ? C.gold : 'transparent'}`, borderBottom: i < CATS.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {/* Add */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Add to {cat.label}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cat.hasParent && parents.length > 0 && (
                <select value={newParent} onChange={e => setNewParent(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 150 }}>
                  {parents.map(p => <option key={p.id} value={p.value}>{p.value}</option>)}
                </select>
              )}
              <input type="text" value={newValue} placeholder={`New ${cat.label.replace(/s$/, '').toLowerCase()}…`}
                onChange={e => setNewValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()}
                style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
              <button onClick={addItem} style={{ background: C.gold, color: '#111', border: 'none', padding: '8px 18px', borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>+ Add</button>
            </div>
          </div>

          {/* Active */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 16 }}>
            <div style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>Active ({activeItems.length})</span>
            </div>
            {loading ? <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontSize: 13 }}>Loading…</div>
              : activeItems.length === 0 ? <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontSize: 13 }}>No items yet</div>
              : activeItems.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: idx < activeItems.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <button onClick={() => move(item, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? C.border : C.muted, fontSize: 10, padding: '1px 3px' }}>▲</button>
                    <button onClick={() => move(item, 'down')} disabled={idx === activeItems.length - 1} style={{ background: 'none', border: 'none', cursor: idx === activeItems.length - 1 ? 'default' : 'pointer', color: idx === activeItems.length - 1 ? C.border : C.muted, fontSize: 10, padding: '1px 3px' }}>▼</button>
                  </div>
                  {cat.hasParent && item.parent && <span style={{ fontSize: 10, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 3, padding: '2px 7px', color: C.muted, whiteSpace: 'nowrap' }}>{item.parent}</span>}
                  {editId === item.id
                    ? <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null); }} style={{ ...inputStyle, flex: 1 }} />
                    : <span style={{ flex: 1, fontSize: 13, color: C.dark }}>{item.value}</span>}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {editId === item.id ? (
                      <><button onClick={saveEdit} style={{ background: C.gold, border: 'none', padding: '4px 10px', borderRadius: 3, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>Save</button>
                      <button onClick={() => setEditId(null)} style={{ background: C.panel, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Cancel</button></>
                    ) : (
                      <><button onClick={() => { setEditId(item.id); setEditVal(item.value); }} style={{ background: C.panel, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Edit</button>
                      <button onClick={() => toggleActive(item)} style={{ background: C.panel, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', fontSize: 12, color: C.muted, fontFamily: 'inherit' }}>Hide</button>
                      <button onClick={() => deleteItem(item)} style={{ background: C.errorBg, border: `1px solid ${C.error}`, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', fontSize: 12, color: C.error, fontFamily: 'inherit' }}>Delete</button></>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Hidden */}
          {inactiveItems.length > 0 && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>Hidden ({inactiveItems.length})</span>
              </div>
              {inactiveItems.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: idx < inactiveItems.length - 1 ? `1px solid ${C.border}` : 'none', opacity: 0.5 }}>
                  {cat.hasParent && item.parent && <span style={{ fontSize: 10, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 3, padding: '2px 7px', color: C.muted }}>{item.parent}</span>}
                  <span style={{ flex: 1, fontSize: 13, color: C.muted, textDecoration: 'line-through' }}>{item.value}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => toggleActive(item)} style={{ background: C.successBg, border: `1px solid ${C.success}`, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', fontSize: 12, color: C.success, fontFamily: 'inherit' }}>Restore</button>
                    <button onClick={() => deleteItem(item)} style={{ background: C.errorBg, border: `1px solid ${C.error}`, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', fontSize: 12, color: C.error, fontFamily: 'inherit' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? C.errorBg : C.successBg, border: `1px solid ${toast.type === 'error' ? C.error : C.success}`, color: toast.type === 'error' ? C.error : C.success, padding: '12px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
