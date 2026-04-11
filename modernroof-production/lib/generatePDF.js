export const generateCustomerPDF = async (job, pp) => {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  const gold  = [245, 184, 0];
  const dark  = [34, 34, 34];
  const mid   = [100, 100, 100];
  const light = [247, 247, 245];
  const white = [255, 255, 255];
  const dv = (v) => (v && v.startsWith('__other__:') ? v.slice(10) : v) || '—';
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const lm = 18;
  const rm = 194;
  const pw = rm - lm;
  let y = 14;

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(...gold);
  doc.rect(lm, y, 52, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text('MODERN ROOF', lm + 2, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...dark);
  doc.text('Work Authorization Form', rm, y + 2, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mid);
  doc.text('Job #: ' + job.roofr_job_id, rm, y + 7, { align: 'right' });
  doc.text('Date: ' + date, rm, y + 11.5, { align: 'right' });
  doc.text('Rep: ' + (job.sales_rep || ''), rm, y + 16, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setTextColor(...mid);
  doc.text('931 East 86th Street, STE 111', lm, y + 12);
  doc.text('Indianapolis, IN 46240  ·  (317) 883-9296  ·  modernroof.com', lm, y + 16);

  y += 22;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.line(lm, y, rm, y);
  y += 8;

  // ── Customer Block ──────────────────────────────────────────────────────────
  doc.setFillColor(...light);
  doc.rect(lm, y, pw, 22, 'F');
  const cFields = [
    ['Customer', job.customer_name || '—'],
    ['Phone', job.phone || '—'],
    ['Email', job.email || '—'],
    ['Address', ((job.address || '') + ', ' + (job.city || '') + ', ' + (job.state || '') + ' ' + (job.zip || '')).trim()],
    ['Sales Rep', job.sales_rep || '—'],
  ];
  cFields.forEach((f, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = lm + 3 + col * 58;
    const cy = y + 5 + row * 11;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...mid);
    doc.text(f[0].toUpperCase(), cx, cy);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.text(f[1], cx, cy + 4.5);
  });
  y += 28;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  // Gold trade section banner
  const tradeBanner = (icon, title) => {
    doc.setFillColor(...gold);
    doc.rect(lm, y, pw, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.text(icon + '  ' + title.toUpperCase(), lm + 4, y + 5.5);
    y += 14;
  };

  // Gray subsection label
  const subSection = (title) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...mid);
    doc.text(title.toUpperCase(), lm, y);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(lm, y + 1.5, rm, y + 1.5);
    y += 7;
  };

  // Two-column material row
  const matRow = (label, value, col) => {
    const cx = col === 0 ? lm : lm + pw / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...mid);
    doc.text(label.toUpperCase(), cx, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(String(value), cx, y + 5);
  };

  const rowStep = () => { y += 10; };

  // ── Scope Checkboxes ────────────────────────────────────────────────────────
  subSection('Trade Work Authorized');
  const scopes = [
    { label: 'Roofing',         on: pp.scope_roof },
    { label: 'Gutters',         on: pp.scope_gutters },
    { label: 'Siding',          on: pp.scope_siding },
    { label: 'Windows',         on: pp.scope_windows },
    { label: 'Soffit & Fascia', on: pp.scope_sf },
  ];
  let sx = lm;
  scopes.forEach((s) => {
    // Checkbox
    doc.setDrawColor(...dark);
    doc.setLineWidth(0.5);
    doc.rect(sx, y - 3.5, 4, 4);
    if (s.on) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...dark);
      doc.text('X', sx + 0.7, y);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.text(s.label, sx + 5.5, y);
    sx += 38;
  });
  y += 14;

  // ── Roofing ─────────────────────────────────────────────────────────────────
  if (pp.scope_roof) {
    tradeBanner('', 'Roofing Selections');
    matRow('Shingle Manufacturer', dv(pp.shingle_brand), 0);
    matRow('Shingle Model / Type', dv(pp.shingle_type), 1);
    rowStep();
    matRow('Shingle Color', dv(pp.shingle_color), 0);
    matRow('Drip Edge / Gutter Apron Color', dv(pp.drip_edge_color), 1);
    rowStep();
    matRow('Warranty', dv(pp.warranty), 0);
    y += 12;
  }

  // ── Gutters ─────────────────────────────────────────────────────────────────
  if (pp.scope_gutters) {
    tradeBanner('', 'Gutter Selections');
    matRow('Gutter Color', dv(pp.gutter_color), 0);
    matRow('Gutter Size', dv(pp.gutter_size), 1);
    rowStep();
    matRow('Gutter Guards', pp.gutter_guards ? 'Yes' : 'No', 0);
    if (pp.gutter_guards && pp.guard_type) matRow('Guard Type', pp.guard_type, 1);
    y += 12;
  }

  // ── Siding ──────────────────────────────────────────────────────────────────
  if (pp.scope_siding) {
    tradeBanner('', 'Siding Selections');
    matRow('Manufacturer', dv(pp.siding_brand), 0);
    matRow('Product Line', dv(pp.siding_type_line), 1);
    rowStep();
    matRow('Style', dv(pp.siding_style), 0);
    matRow('Color', dv(pp.siding_color), 1);
    y += 12;
  }

  // ── Soffit & Fascia ─────────────────────────────────────────────────────────
  if (pp.scope_sf) {
    tradeBanner('', 'Soffit & Fascia Selections');
    matRow('Material', dv(pp.sf_material), 0);
    matRow('Color', dv(pp.sf_color), 1);
    rowStep();
    matRow('Soffit Width', dv(pp.soffit_width), 0);
    matRow('Vented Soffit', pp.soffit_vented ? 'Yes' : 'No', 1);
    rowStep();
    matRow('Fascia Height', dv(pp.fascia_height), 0);
    y += 12;
  }

  // ── Scope of Work ───────────────────────────────────────────────────────────
  subSection('Scope of Work');
  doc.setFillColor(...light);
  doc.rect(lm, y, pw, 30, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...mid);
  const line1 = 'Contractor is authorized to perform all necessary work related to the above trades as approved by the insurance';
  const line2 = 'carrier and supplemented as required to meet current building codes, manufacturer specifications, and local ordinances.';
  const line3 = 'Work may include removal of damaged materials, installation of replacement materials, code-required upgrades, and';
  const line4 = 'debris removal.';
  const line5 = 'Customer acknowledges that Modern Roof intentionally orders additional materials to accommodate for waste. Any';
  const line6 = 'unused materials remain the property of Modern Roof. Please review all selections and contact your representative';
  const line7 = 'within 48 hours if you have any questions or changes.';
  [line1, line2, line3, line4, '', line5, line6, line7].forEach((line, i) => {
    doc.text(line, lm + 3, y + 5 + i * 3.6);
  });
  y += 36;

  // ── Signatures ──────────────────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(lm, y, rm, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...mid);
  doc.text('CUSTOMER AUTHORIZATION', lm, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...mid);
  doc.text('By signing below, the customer confirms all material selections are correct and authorizes Modern Roof to proceed.', lm, y);
  y += 14;

  const sigW = 52;
  const sigGap = 62;
  const sigLabels = ['Customer Signature', 'Print Name', 'Date'];
  sigLabels.forEach((lbl, i) => {
    const px = lm + i * sigGap;
    doc.setDrawColor(...dark);
    doc.setLineWidth(0.6);
    doc.line(px, y + 14, px + sigW, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...mid);
    doc.text(lbl.toUpperCase(), px, y + 19);
  });

  // ── Footer ──────────────────────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(lm, 270, rm, 270);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...mid);
  doc.text('Modern Roof  ·  modernroof.com  ·  (317) 883-9296', lm, 274);
  doc.text('Job #' + job.roofr_job_id, rm, 274, { align: 'right' });

  doc.save('ModernRoof-' + job.roofr_job_id + '-CustomerAuth.pdf');
};
