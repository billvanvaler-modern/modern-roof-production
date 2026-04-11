export const generateCustomerPDF = async (job, pp) => {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  const gold = [245, 184, 0];
  const dark = [34, 34, 34];
  const mid = [100, 100, 100];
  const light = [247, 247, 245];
  const dv = (v) => (v && v.startsWith('__other__:') ? v.slice(10) : v) || '—';
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const lm = 18;
  const pw = 176;
  let y = 14;

  // Gold badge
  doc.setFillColor(...gold);
  doc.rect(lm, y, 52, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(17, 17, 17);
  doc.text('MODERN ROOF', lm + 2, y + 5);

  // Doc info right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...dark);
  doc.text('Work Authorization Form', 194, y + 2, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...mid);
  doc.text('Job #: ' + job.roofr_job_id, 194, y + 7, { align: 'right' });
  doc.text('Date: ' + date, 194, y + 11, { align: 'right' });
  doc.text('Rep: ' + (job.sales_rep || ''), 194, y + 15, { align: 'right' });

  // Company address
  doc.setFontSize(7);
  doc.setTextColor(...mid);
  doc.text('931 East 86th Street, STE 111', lm, y + 11);
  doc.text('Indianapolis, IN 46240  ·  (317) 883-9296  ·  modernroof.com', lm, y + 15);

  y += 22;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.line(lm, y, 194, y);
  y += 8;

  // Customer block
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
    doc.text(f[1], cx, cy + 4);
  });
  y += 28;

  const section = (title) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...mid);
    doc.text(title.toUpperCase(), lm, y);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(lm, y + 1, 194, y + 1);
    y += 7;
  };

  const matRow = (label, value, col) => {
    const cx = col === 0 ? lm : lm + pw / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...mid);
    doc.text(label.toUpperCase(), cx, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...dark);
    doc.text(value, cx, y + 4.5);
  };

  // Scope
  section('Trade Work Authorized');
  const scopes = [
    { label: 'Roofing', on: pp.scope_roof },
    { label: 'Gutters', on: pp.scope_gutters },
    { label: 'Siding', on: pp.scope_siding },
    { label: 'Windows', on: pp.scope_windows },
    { label: 'Soffit & Fascia', on: pp.scope_sf },
  ];
  let sx = lm;
  scopes.forEach((s) => {
    if (s.on) {
      doc.setFillColor(...gold);
      doc.rect(sx, y - 3.5, 4, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(17, 17, 17);
      doc.text('✓', sx + 0.8, y);
    } else {
      doc.setDrawColor(...dark);
      doc.setLineWidth(0.4);
      doc.rect(sx, y - 3.5, 4, 4);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.text(s.label, sx + 5.5, y);
    sx += 36;
  });
  y += 10;

  // Roofing
  if (pp.scope_roof) {
    section('Roofing Selections');
    matRow('Shingle Manufacturer', dv(pp.shingle_brand), 0);
    matRow('Shingle Model', dv(pp.shingle_type), 1);
    y += 9;
    matRow('Shingle Color', dv(pp.shingle_color), 0);
    matRow('Drip Edge / Gutter Apron Color', dv(pp.drip_edge_color), 1);
    y += 9;
    matRow('Warranty', dv(pp.warranty), 0);
    y += 9;
  }

  // Gutters
  if (pp.scope_gutters) {
    section('Gutter Selections');
    matRow('Gutter Color', dv(pp.gutter_color), 0);
    matRow('Gutter Size', dv(pp.gutter_size), 1);
    y += 9;
    matRow('Gutter Guards', pp.gutter_guards ? 'Yes' : 'No', 0);
    if (pp.gutter_guards && pp.guard_type) matRow('Guard Type', pp.guard_type, 1);
    y += 9;
  }

  // Siding
  if (pp.scope_siding) {
    section('Siding Selections');
    matRow('Manufacturer', dv(pp.siding_brand), 0);
    matRow('Product Line', dv(pp.siding_type_line), 1);
    y += 9;
    matRow('Style', dv(pp.siding_style), 0);
    matRow('Color', dv(pp.siding_color), 1);
    y += 9;
  }

  // Soffit & Fascia
  if (pp.scope_sf) {
    section('Soffit & Fascia Selections');
    matRow('Material', dv(pp.sf_material), 0);
    matRow('Color', dv(pp.sf_color), 1);
    y += 9;
    matRow('Soffit Width', dv(pp.soffit_width), 0);
    matRow('Vented Soffit', pp.soffit_vented ? 'Yes' : 'No', 1);
    y += 9;
    matRow('Fascia Height', dv(pp.fascia_height), 0);
    y += 9;
  }

  // Scope of work
  section('Scope of Work');
  const scopeLine1 = 'Contractor is authorized to perform all necessary work related to the above trades as approved by the';
  const scopeLine2 = 'insurance carrier and supplemented as required to meet current building codes, manufacturer specifications,';
  const scopeLine3 = 'and local ordinances. Work may include removal of damaged materials, installation of replacement materials,';
  const scopeLine4 = 'code-required upgrades, and debris removal.';
  const scopeLine5 = 'Customer acknowledges that Modern Roof intentionally orders additional materials to accommodate for waste.';
  const scopeLine6 = 'Any unused materials remain the property of Modern Roof. Please review all material selections carefully';
  const scopeLine7 = 'and contact your Modern Roof representative within 48 hours if you have any questions or changes.';

  doc.setFillColor(...light);
  doc.rect(lm, y, pw, 32, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mid);
  [scopeLine1, scopeLine2, scopeLine3, scopeLine4, '', scopeLine5, scopeLine6, scopeLine7].forEach((line, i) => {
    doc.text(line, lm + 3, y + 5 + i * 3.8);
  });
  y += 38;

  // Signature
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(lm, y, 194, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...mid);
  doc.text('CUSTOMER AUTHORIZATION', lm, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mid);
  doc.text('By signing below, the customer confirms all material selections are correct and authorizes Modern Roof to proceed.', lm, y);
  y += 12;

  const sigPositions = [lm, lm + 62, lm + 124];
  const sigLabels = ['Customer Signature', 'Print Name', 'Date'];
  sigPositions.forEach((px, i) => {
    doc.setDrawColor(...dark);
    doc.setLineWidth(0.6);
    doc.line(px, y + 14, px + 52, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...mid);
    doc.text(sigLabels[i].toUpperCase(), px, y + 18);
  });

  // Footer
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(lm, 270, 194, 270);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...mid);
  doc.text('Modern Roof  ·  modernroof.com  ·  (317) 883-9296', lm, 274);
  doc.text('Job #' + job.roofr_job_id, 194, 274, { align: 'right' });

  doc.save('ModernRoof-' + job.roofr_job_id + '-CustomerAuth.pdf');
};
