import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const gold = '#F5B800';
const dark = '#222222';
const mid  = '#555555';
const light = '#F7F7F5';
const border = '#DDDDDD';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: dark,
    padding: '48 52 60 52',
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: gold,
  },
  logoBlock: { flexDirection: 'column' },
  logoBadge: {
    backgroundColor: gold,
    color: '#111',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.2,
    padding: '4 8',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  companyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: dark, letterSpacing: -0.5 },
  companyAddress: { fontSize: 8, color: mid, marginTop: 4, lineHeight: 1.6 },
  docInfo: { alignItems: 'flex-end' },
  docTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: dark, marginBottom: 4 },
  docMeta: { fontSize: 8, color: mid, lineHeight: 1.8, textAlign: 'right' },

  // Customer block
  customerBlock: {
    backgroundColor: light,
    padding: '12 14',
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  customerField: { width: '33%', marginBottom: 8 },
  customerFieldWide: { width: '66%', marginBottom: 8 },
  fieldLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, color: mid, textTransform: 'uppercase', marginBottom: 2 },
  fieldValue: { fontSize: 10, color: dark },

  // Section
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: mid,
    borderBottomWidth: 1,
    borderBottomColor: border,
    paddingBottom: 4,
    marginBottom: 10,
    marginTop: 14,
  },

  // Scope checkboxes
  scopeRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  scopeItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  checkbox: {
    width: 12, height: 12,
    borderWidth: 1.5,
    borderColor: dark,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    width: 12, height: 12,
    backgroundColor: gold,
    borderWidth: 1.5,
    borderColor: gold,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#111' },
  scopeLabel: { fontSize: 10 },

  // Materials grid
  materialsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  materialItem: { width: '50%', paddingRight: 16, marginBottom: 10 },
  materialLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, color: mid, textTransform: 'uppercase', marginBottom: 2 },
  materialValue: { fontSize: 10, color: dark, fontFamily: 'Helvetica-Bold' },

  // Scope of work text
  scopeBox: {
    backgroundColor: light,
    padding: '10 12',
    marginTop: 4,
    marginBottom: 4,
  },
  scopeText: { fontSize: 9, color: mid, lineHeight: 1.7 },

  // Signature
  signatureSection: {
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: border,
  },
  signatureTitle: {
    fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1,
    textTransform: 'uppercase', color: mid, marginBottom: 14,
  },
  signatureNotice: { fontSize: 8, color: mid, lineHeight: 1.7, marginBottom: 20 },
  signatureGrid: { flexDirection: 'row', gap: 32 },
  signatureBlock: { flex: 1 },
  signatureLine: { borderBottomWidth: 1.5, borderBottomColor: dark, height: 32, marginBottom: 4 },
  signatureLineLabel: { fontSize: 8, color: mid, letterSpacing: 0.5, textTransform: 'uppercase' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 52,
    right: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: border,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: mid },
});

function Checkbox({ checked }) {
  return (
    <View style={checked ? styles.checkboxChecked : styles.checkbox}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );
}

function CustomerPDF({ job, pp, date }) {
  const dv = v => (v && v.startsWith('__other__:') ? v.slice(10) : v) || '—';

  const scopeItems = [
    { label: 'Roofing',        on: pp.scope_roof },
    { label: 'Gutters',        on: pp.scope_gutters },
    { label: 'Siding',         on: pp.scope_siding },
    { label: 'Windows',        on: pp.scope_windows },
    { label: 'Soffit & Fascia',on: pp.scope_sf },
  ].filter(s => s.on);

  const allScope = [
    { label: 'Roofing',         on: pp.scope_roof },
    { label: 'Gutters',         on: pp.scope_gutters },
    { label: 'Siding',          on: pp.scope_siding },
    { label: 'Windows',         on: pp.scope_windows },
    { label: 'Soffit & Fascia', on: pp.scope_sf },
  ];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBlock}>
            <Text style={styles.logoBadge}>MODERN ROOF</Text>
            <Text style={styles.companyAddress}>
              931 East 86th Street, STE 111{'\n'}
              Indianapolis, IN 46240{'\n'}
              (317) 883-9296  ·  modernroof.com
            </Text>
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>Work Authorization Form</Text>
            <Text style={styles.docMeta}>
              Job #: {job.roofr_job_id}{'\n'}
              Date: {date}{'\n'}
              Rep: {job.sales_rep}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerBlock}>
          <View style={styles.customerField}>
            <Text style={styles.fieldLabel}>Customer</Text>
            <Text style={styles.fieldValue}>{job.customer_name}</Text>
          </View>
          <View style={styles.customerField}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <Text style={styles.fieldValue}>{job.phone || '—'}</Text>
          </View>
          <View style={styles.customerField}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>{job.email || '—'}</Text>
          </View>
          <View style={styles.customerFieldWide}>
            <Text style={styles.fieldLabel}>Address</Text>
            <Text style={styles.fieldValue}>{job.address}, {job.city}, {job.state} {job.zip}</Text>
          </View>
        </View>

        {/* Scope Checkboxes */}
        <Text style={styles.sectionTitle}>Trade Work Authorized</Text>
        <View style={styles.scopeRow}>
          {allScope.map(s => (
            <View key={s.label} style={styles.scopeItem}>
              <Checkbox checked={s.on} />
              <Text style={styles.scopeLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Roofing Selections */}
        {pp.scope_roof && (
          <>
            <Text style={styles.sectionTitle}>Roofing Selections</Text>
            <View style={styles.materialsGrid}>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Shingle Manufacturer</Text>
                <Text style={styles.materialValue}>{dv(pp.shingle_brand)}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Shingle Model</Text>
                <Text style={styles.materialValue}>{dv(pp.shingle_type)}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Shingle Color</Text>
                <Text style={styles.materialValue}>{dv(pp.shingle_color)}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Drip Edge / Gutter Apron Color</Text>
                <Text style={styles.materialValue}>{dv(pp.drip_edge_color)}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Warranty</Text>
                <Text style={styles.materialValue}>{dv(pp.warranty)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Gutter Selections */}
        {pp.scope_gutters && (
          <>
            <Text style={styles.sectionTitle}>Gutter Selections</Text>
            <View style={styles.materialsGrid}>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Gutter Color</Text>
                <Text style={styles.materialValue}>{dv(pp.gutter_color)}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Gutter Size</Text>
                <Text style={styles.materialValue}>{dv(pp.gutter_size)}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Gutter Guards</Text>
                <Text style={styles.materialValue}>{pp.gutter_guards ? 'Yes' : 'No'}</Text>
              </View>
              {pp.gutter_guards && pp.guard_type && (
                <View style={styles.materialItem}>
                  <Text style={styles.materialLabel}>Guard Type</Text>
                  <Text style={styles.materialValue}>{pp.guard_type}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Siding Selections */}
        {pp.scope_siding && (
          <>
            <Text style={styles.sectionTitle}>Siding Selections</Text>
            <View style={styles.materialsGrid}>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Manufacturer</Text>
                <Text style={styles.materialValue}>{dv(pp.siding_brand)}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Product Line</Text>
                <Text style={styles.materialValue}>{dv(pp.siding_type_line)}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Style</Text>
                <Text style={styles.materialValue}>{dv(pp.siding_style)}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Color</Text>
                <Text style={styles.materialValue}>{dv(pp.siding_color)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Soffit & Fascia */}
        {pp.scope_sf && (
          <>
            <Text style={styles.sectionTitle}>Soffit & Fascia Selections</Text>
            <View style={styles.materialsGrid}>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Material</Text>
                <Text style={styles.materialValue}>{dv(pp.sf_material)}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Color</Text>
                <Text style={styles.materialValue}>{dv(pp.sf_color)}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Soffit Width</Text>
                <Text style={styles.materialValue}>{dv(pp.soffit_width)}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Vented Soffit</Text>
                <Text style={styles.materialValue}>{pp.soffit_vented ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.materialItem}>
                <Text style={styles.materialLabel}>Fascia Height</Text>
                <Text style={styles.materialValue}>{dv(pp.fascia_height)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Scope of Work */}
        <Text style={styles.sectionTitle}>Scope of Work</Text>
        <View style={styles.scopeBox}>
          <Text style={styles.scopeText}>
            Contractor is authorized to perform all necessary work related to the above trades, as approved by the insurance carrier and/or supplemented as required to meet current building codes, manufacturer specifications, and local ordinances. Work may include but is not limited to removal of damaged materials, installation of replacement materials, code-required upgrades, and debris removal.{'\n\n'}
            Customer acknowledges that Modern Roof intentionally orders additional materials to ensure proper installation and accommodate for waste. Any unused materials remain the property of Modern Roof and will be collected or returned upon completion of the job.{'\n\n'}
            Please review all material selections above carefully. If you have any questions or changes, contact your Modern Roof representative within 48 hours of receiving this document.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureTitle}>Customer Authorization</Text>
          <Text style={styles.signatureNotice}>
            By signing below, the customer confirms that all material selections and project details listed above are correct and authorizes Modern Roof to proceed with the work as described.
          </Text>
          <View style={styles.signatureGrid}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLineLabel}>Customer Signature</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLineLabel}>Print Name</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLineLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Modern Roof  ·  modernroof.com  ·  (317) 883-9296</Text>
          <Text style={styles.footerText}>Job #{job.roofr_job_id}</Text>
        </View>

      </Page>
    </Document>
  );
}

export async function GET(request, { params }) {
  const { id } = params;

  // Fetch job
  const { data: job } = await supabase.from('jobs').select('*').eq('roofr_job_id', id).single();
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  // Fetch preproduction
  const { data: pp } = await supabase.from('preproduction').select('*').eq('job_id', id).single();
  if (!pp) return NextResponse.json({ error: 'No pre-production data found' }, { status: 404 });

  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const buffer = await renderToBuffer(<CustomerPDF job={job} pp={pp} date={date} />);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ModernRoof-${id}-CustomerAuth.pdf"`,
    },
  });
}
