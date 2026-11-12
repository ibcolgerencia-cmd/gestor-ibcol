// =====================================================================
//  CRONOGRAMA DE ASEGURAMIENTO METROLÓGICO (FMB-003)
//  PDF igual al formato Excel: encabezado de la entidad (logo, nombre, dirección,
//  teléfono/NIT, sede, correo) · Código / Versión / Fecha de aprobación ·
//  REPS / servicio / fecha de actualización · tabla SERVICIO, EQUIPO, MARCA, MODELO,
//  SERIE, ACTIVO FIJO, PROVEEDOR, TIPO (CAL / VAL) y 12 meses con CP (calibración
//  programada) y CE (calibración ejecutada) · convenciones y "Elaborado por".
//  Proveedor y tipo de cada equipo: equipos.hv.met_proveedor / equipos.hv.met_tipo.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, toast, modal, leer } = UI;
  const MES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPT', 'OCTUBRE', 'NOVIEMB', 'DICIEMB'];
  const U = (t) => String(t || '').toUpperCase();
  const fUS = (s) => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${+m[3]}/${+m[2]}/${m[1]}` : String(s || ''); };
  const fD = (s) => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };
  const NR = (v) => (v == null || String(v).trim() === '' ? 'NR' : String(v));

  A.pdfCronoMetro = async ({ ent, filas, ventana, equipos, consultorios = [], cons = null, fmt = {} }) => {
    const emp = st.emp || {}; const firma = st.firma || null;
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'letter', orientation: 'landscape' });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 7, ancho = W - 2 * M;
    const N = [0, 0, 0], GR = [200, 200, 200], GR2 = [218, 218, 218], CY = [0, 176, 240], AZ = [0, 112, 192];
    const eqd = (id) => equipos.find((e) => e.id === id) || {};
    const servDe = (e) => consultorios.find((c) => c.id === e.consultorio_id)?.nombre || '';
    const img = (src, x, y, mw, mh) => { if (!src) return; try { const p = doc.getImageProperties(src); const r = Math.min(mw / p.width, mh / p.height); doc.addImage(src, /^data:image\/png/i.test(src) ? 'PNG' : 'JPEG', x + (mw - p.width * r) / 2, y + (mh - p.height * r) / 2, p.width * r, p.height * r); } catch (er) { console.warn(er); } };
    const celda = (x, y, w, hh, t, o = {}) => {
      if (o.fill) { doc.setFillColor(...o.fill); doc.rect(x, y, w, hh, o.sinBorde ? 'F' : 'FD'); } else if (!o.sinBorde) doc.rect(x, y, w, hh);
      if (!t) return; doc.setFont('helvetica', o.bold ? 'bold' : 'normal'); doc.setFontSize(o.fs || 7); doc.setTextColor(...(o.color || N));
      const ln = doc.splitTextToSize(String(t), w - 1.6); const lh = (o.fs || 7) * 0.4; const y0 = y + hh / 2 - ((ln.length - 1) * lh) / 2 + lh * 0.36;
      ln.forEach((l, i) => doc.text(l, o.left ? x + 1.2 : x + w / 2, y0 + i * lh, { align: o.left ? 'left' : 'center' }));
      doc.setTextColor(...N);
    };
    const ent2 = ent || {};
    const sedeTxt = cons ? U([cons.sede ? 'SEDE ' + cons.sede : '', cons.nombre].filter(Boolean).join(' - ')) : U(ent2.ciudad ? 'SEDE ' + ent2.ciudad : '');
    const servTxt = cons?.nombre ? `SERVICIO - ${U(cons.nombre)}` : 'SERVICIO - TODOS LOS SERVICIOS';
    // ---- encabezado (filas 1-8 del Excel)
    const encabezado = () => {
      doc.setDrawColor(...N); doc.setLineWidth(0.25);
      const y = M, wL = 52, wR = 50, wC = ancho - wL - wR, xC = M + wL, xR = xC + wC;
      const fh = [7.5, 5, 5, 5, 5, 5], tot = fh.reduce((a, b) => a + b, 0);
      doc.rect(M, y, wL, tot); img(ent2.logo, M + 2, y + 1.5, wL - 4, tot - 3);
      const tx = [[fmt.titulo || 'CRONOGRAMA DE ASEGURAMIENTO METROLÓGICO', { bold: true, fs: 11, color: AZ, fill: GR }], [U(ent2.razon_social), { bold: true, fs: 7.5 }],
        [ent2.direccion || ent2.ciudad ? `DIRECCIÓN: ${U([ent2.direccion, ent2.ciudad].filter(Boolean).join(', '))}` : '', { bold: true, fs: 6.8 }],
        [[ent2.telefono ? `TEL / CEL: ${ent2.telefono}` : '', ent2.nit ? `NIT: ${ent2.nit}` : ''].filter(Boolean).join('. '), { bold: true, fs: 6.8 }],
        [sedeTxt, { bold: true, fs: 6.8 }], [ent2.email ? `E-MAIL: ${ent2.email}` : '', { bold: true, fs: 6.8 }]];
      let yy = y; tx.forEach(([t, o], i) => { celda(xC, yy, wC, fh[i], t, o); yy += fh[i]; });
      // derecha: código (filas 1-2), versión (3-4), fecha aprobación (5) y fecha (6)
      celda(xR, y, wR, fh[0] + fh[1], `CÓDIGO ${fmt.codigo || 'FMB-003'}`, { bold: true, fs: 9 });
      celda(xR, y + fh[0] + fh[1], wR, fh[2] + fh[3], `VERSIÓN  ${fmt.version || '01'}`, { bold: true, fs: 9 });
      celda(xR, y + fh[0] + fh[1] + fh[2] + fh[3], wR, fh[4], 'FECHA APROBACIÓN', { bold: true, fs: 8 });
      celda(xR, y + tot - fh[5], wR, fh[5], fUS(fmt.fecha || '2021-08-02'), { bold: true, fs: 8.5 });
      // fila 8: REPS · servicio · fecha de actualización
      const y8 = y + tot + 2, h8 = 5.5, wA = 40, wD = 26, wS = ancho - wA - wD - wR;
      celda(M, y8, wA, h8, 'CÓDIGO DEL  PRESTADOR (REPS)', { bold: true, fs: 6.5, color: CY, fill: GR });
      celda(M + wA, y8, wD, h8, ent2.reps || '', { bold: true, fs: 7 });
      celda(M + wA + wD, y8, wS, h8, servTxt, { bold: true, fs: 7.5 });
      celda(xR, y8, wR, h8, `FECHA ACTUALIZACIÓN: ${fD(UI.hoy())}`, { bold: true, fs: 5.8 });
      return y8 + h8 + 2.5;
    };
    const y0 = encabezado();
    // ---- tabla
    const meses = ventana.map((v) => v);
    const marca = (plan, m) => { const vs = Object.entries(plan || {}).filter(([k, v]) => k !== 'notas' && v && +k.split('-')[0] === m).map(([, v]) => v); return { cp: vs.some((v) => ['P', 'E', 'N'].includes(v)), ce: vs.includes('E'), n: vs.includes('N'), g: vs.find((v) => v === 'G' || v === 'C') }; };
    const body = filas.map((r) => {
      const e = eqd(r.equipo_id); const tip = (e.hv?.met_tipo || 'CAL').toUpperCase();
      const fila = [U(servDe(e)), U(e.nombre || r.tema || ''), U(NR(e.marca)), U(NR(e.modelo)), U(NR(e.serie)), U(NR(e.activo_fijo)), U(e.hv?.met_proveedor || fmt.proveedor || ''), tip.includes('CAL') ? 'X' : '', tip.includes('VAL') ? 'X' : ''];
      meses.forEach((v) => { const k = marca(r.cr[v.y]?.plan, v.m); fila.push(k.g || (k.cp ? (k.n ? 'N' : 'X') : ''), k.ce ? 'X' : ''); });
      return fila;
    });
    const cw = [22, 24, 18, 17, 17, 14, 18, 5.5, 5.5]; const fijo = cw.reduce((a, b) => a + b, 0); const wm = (ancho - fijo) / 24;
    const colStyles = {}; cw.forEach((w, i) => { colStyles[i] = { cellWidth: w }; }); for (let i = 0; i < 24; i++) colStyles[9 + i] = { cellWidth: wm, halign: 'center', fontStyle: 'bold' };
    colStyles[7] = { ...colStyles[7], fillColor: GR2, halign: 'center', fontStyle: 'bold' }; colStyles[8] = { ...colStyles[8], fillColor: GR2, halign: 'center', fontStyle: 'bold' };
    const hd = (t, o = {}) => ({ content: t, ...o });
    const head = [[hd('SERVICIO', { rowSpan: 2 }), hd('EQUIPO', { rowSpan: 2 }), hd('MARCA', { rowSpan: 2 }), hd('MODELO', { rowSpan: 2 }), hd('SERIE', { rowSpan: 2 }), hd('ACTIVO FIJO', { rowSpan: 2 }), hd('PROVEEDOR', { rowSpan: 2 }), hd('TIPO', { colSpan: 2 }),
      ...meses.map((v) => hd(ventana[0].y !== ventana[11].y ? `${MES[v.m - 1].slice(0, 3)} ${String(v.y).slice(2)}` : MES[v.m - 1], { colSpan: 2 }))],
    ['CAL', 'VAL', ...meses.flatMap(() => ['CP', 'CE'])]];
    const minFilas = 14; while (body.length < minFilas) body.push(Array(33).fill(''));
    doc.autoTable({ startY: y0, theme: 'grid', margin: { left: M, right: M, top: y0, bottom: 36 }, tableWidth: ancho, head, body,
      styles: { fontSize: 5.8, cellPadding: 0.7, lineColor: N, lineWidth: 0.18, textColor: N, valign: 'middle', halign: 'center', overflow: 'linebreak', minCellHeight: 8 },
      headStyles: { fillColor: GR, textColor: CY, fontStyle: 'bold', fontSize: 5.6, cellPadding: 0.5, minCellHeight: 4.5, lineColor: N, lineWidth: 0.18 },
      columnStyles: colStyles,
      didParseCell: (c) => {
        if (c.section === 'head' && c.row.index === 1) { c.cell.styles.fillColor = GR2; c.cell.styles.fontSize = 5; if (c.column.index >= 9) c.cell.styles.textColor = N; }
        if (c.section === 'body' && c.column.index >= 9) {
          const v = String(c.cell.raw || ''); const ce = (c.column.index - 9) % 2 === 1;
          if (v === 'X' && !ce) c.cell.styles.fillColor = [255, 214, 102];
          if (v === 'X' && ce) c.cell.styles.fillColor = [95, 190, 120];
          if (v === 'N') c.cell.styles.fillColor = [235, 110, 100];
          if (v === 'G') c.cell.styles.fillColor = [185, 163, 227];
          if (v === 'C') c.cell.styles.fillColor = [124, 196, 232];
        }
      },
      didDrawPage: () => { if (doc.getCurrentPageInfo().pageNumber > 1) encabezado(); } });
    // ---- convenciones y elaborado por (filas 28-34)
    let y = doc.lastAutoTable.finalY + 1; if (y + 34 > H - 8) { doc.addPage(); y = encabezado(); }
    const wConv = 62, xE = M + wConv + 2, wE = ancho - wConv - 2, rh = 4.6;
    celda(M, y, wConv, rh, 'CONVENCIONES', { bold: true, fs: 8, color: AZ });
    [['CP', 'CALIBRACIÓN PROGRAMADA'], ['CE', 'CALIBRACIÓN EJECUTADA'], ['CAL', 'CALIBRACIÓN'], ['VAL', 'VALIDACIÓN'], ['NR', 'NO REGISTRA'], ['NA', 'NO APLICA']].forEach(([a, b], i) => {
      celda(M, y + rh * (i + 1), 12, rh, a, { bold: true, fs: 6.5, color: CY }); celda(M + 12, y + rh * (i + 1), wConv - 12, rh, b, { fs: 6.2, left: true });
    });
    celda(xE, y, wE, rh, 'ELABORADO POR:', { bold: true, fs: 8 });
    const wN = wE * 0.6, wF = wE - wN;
    celda(xE, y + rh, wN, rh, 'NOMBRES LEGIBLE', { bold: true, fs: 7.5 }); celda(xE + wN, y + rh, wF, rh, 'FIRMA Y SELLO', { bold: true, fs: 7.5 });
    doc.rect(xE, y + rh * 2, wN, rh * 5); doc.rect(xE + wN, y + rh * 2, wF, rh * 5);
    celda(xE, y + rh * 3.4, wN, rh, emp.responsable || '', { fs: 8, sinBorde: true }); celda(xE, y + rh * 4.4, wN, rh, U(emp.cargo || 'INGENIERO BIOMÉDICO'), { bold: true, fs: 7.5, sinBorde: true });
    img(firma, xE + wN + 3, y + rh * 2 + 1, wF - 6, rh * 5 - 2);
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(70); doc.text(`${emp.nombre || 'IBCOL Ingeniería Biomédica de Colombia'}${emp.telefono ? ': ' + emp.telefono : ''}${emp.email ? ' · E-MAIL: ' + emp.email : ''}${emp.direccion ? ' · ' + emp.direccion : ''}`, W / 2, H - 4, { align: 'center' }); doc.text(`Página ${i} de ${n}`, W - M, H - 4, { align: 'right' }); doc.setTextColor(...N); }
    return doc.output('blob');
  };

  // ---- proveedor y tipo (calibración / validación) de cada equipo del cronograma de metrología
  A.formMetroDatos = (filas, equipos, alGuardar) => {
    const eqs = filas.map((r) => equipos.find((e) => e.id === r.equipo_id)).filter(Boolean);
    if (!eqs.length) return toast('No hay equipos en el cronograma', true);
    const prov = [...new Set(equipos.map((e) => e.hv?.met_proveedor).filter(Boolean))];
    modal({ titulo: 'Proveedor y tipo (calibración / validación)', size: 'wide',
      cuerpo: `<form class="form" onsubmit="return false"><p class="muted">Salen en las columnas PROVEEDOR y TIPO (CAL / VAL) del cronograma de aseguramiento metrológico (FMB-003).</p>
        <div class="fields"><div class="field"><label for="mt_todos">Proveedor para todos</label><input id="mt_todos" list="mt_prov" data-todos placeholder="Ej. laboratorio de metrología"></div><div class="field" style="align-self:end"><button type="button" class="btn sm" data-aplicar>Poner a todos</button></div></div>
        <datalist id="mt_prov">${prov.map((p) => `<option value="${h(p)}">`).join('')}</datalist>
        <div class="tbl-wrap" style="max-height:52vh"><table class="tbl"><thead><tr><th>Código</th><th>Equipo</th><th>Serie</th><th>Proveedor</th><th>Tipo</th></tr></thead><tbody>
        ${eqs.map((e) => `<tr><td class="mono">${h(e.codigo_inv || '')}</td><td>${h(e.nombre || '')}</td><td class="mono">${h(e.serie || 'NR')}</td><td><input list="mt_prov" data-prov="${e.id}" value="${h(e.hv?.met_proveedor || '')}" aria-label="Proveedor ${h(e.codigo_inv || '')}"></td>
          <td><select data-tipo="${e.id}" aria-label="Tipo ${h(e.codigo_inv || '')}">${[['CAL', 'Calibración'], ['VAL', 'Validación'], ['CAL/VAL', 'Ambas']].map(([v, t]) => `<option value="${v}" ${(e.hv?.met_tipo || 'CAL') === v ? 'selected' : ''}>${t}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div></form>`,
      alAbrir: (m) => { m.body.querySelector('[data-aplicar]').onclick = () => { const v = m.body.querySelector('[data-todos]').value; m.body.querySelectorAll('[data-prov]').forEach((i) => { i.value = v; }); }; },
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
        let n = 0;
        for (const e of eqs) {
          const p = m.body.querySelector(`[data-prov="${e.id}"]`).value.trim(), t = m.body.querySelector(`[data-tipo="${e.id}"]`).value;
          if (p === (e.hv?.met_proveedor || '') && t === (e.hv?.met_tipo || 'CAL')) continue;
          const hv = { ...(e.hv || {}), met_proveedor: p, met_tipo: t }; await S.update('equipos', e.id, { hv }); e.hv = hv; n++;
        }
        toast(n ? `${n} equipos actualizados` : 'Sin cambios'); if (n && alGuardar) alGuardar();
      } }] });
  };
})();
