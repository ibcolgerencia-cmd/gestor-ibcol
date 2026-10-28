// =====================================================================
//  Generación de PDF con los formatos IBCOL (jsPDF + AutoTable + pdf-lib)
// =====================================================================
window.PDF = (() => {
  // Colores de las plantillas Excel de IBCOL (barras grises con títulos cian, etiquetas azul claro)
  const TEAL = [0, 150, 190], CYAN = [0, 176, 240], GRIS = [221, 243, 250], BARRA = [217, 217, 217], LINEA = [60, 60, 60], TXT = [20, 20, 20];
  const M = 12;
  const fF = (s) => { if (!s) return ''; const d = new Date(String(s).length <= 10 ? s + 'T12:00:00' : s); return isNaN(d) ? String(s) : d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }); };
  const fLarga = (s) => { const d = new Date((s || UI.hoy()) + 'T12:00:00'); return `${d.getDate()} de ${CAT.MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`; };
  const pesos = (n) => '$ ' + Math.round(Number(n) || 0).toLocaleString('es-CO');
  const v = (x) => (x === undefined || x === null || x === '' ? 'NR' : String(x));

  function nuevo(orient = 'p') {
    const doc = new window.jspdf.jsPDF({ orientation: orient, unit: 'mm', format: 'letter' });
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...TXT);
    return doc;
  }
  const W = (doc) => doc.internal.pageSize.getWidth();
  const H = (doc) => doc.internal.pageSize.getHeight();

  function imgFmt(src) { return /^data:image\/png/i.test(src) ? 'PNG' : 'JPEG'; }
  function logo(doc, src, x, y, maxW, maxH) {
    if (!src) return;
    try {
      const p = doc.getImageProperties(src);
      const r = Math.min(maxW / p.width, maxH / p.height);
      const w = p.width * r, h = p.height * r;
      doc.addImage(src, imgFmt(src), x + (maxW - w) / 2, y + (maxH - h) / 2, w, h);
    } catch (e) { console.warn('logo', e); }
  }

  // Encabezado igual al de los formatos IBCOL (FMB-001 / FMB-002):
  // logo de la entidad | título + datos de la entidad | código, versión y fecha de aprobación
  function encabezado(doc, { titulo, fmt = {}, ent, cons = null }) {
    const w = W(doc), x = M, ancho = w - 2 * M, h = 27, lw = 42, rw = 42, cx = x + lw, cw = ancho - lw - rw;
    doc.setDrawColor(...LINEA); doc.setLineWidth(0.25);
    doc.rect(x, M, ancho, h); doc.line(cx, M, cx, M + h); doc.line(cx + cw, M, cx + cw, M + h);
    if (ent?.logo) logo(doc, ent.logo, x + 2, M + 2, lw - 4, h - 4);
    else { doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(['LOGO DE LA EMPRESA', 'CONTRATANTE'], x + lw / 2, M + h / 2 - 1, { align: 'center' }); }
    doc.setFillColor(...BARRA); doc.rect(cx, M, cw, 6, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...TEAL);
    const tt = (titulo || '').toUpperCase(); let fsT = 9.5;
    while (fsT > 5.5 && doc.getStringUnitWidth(tt) * fsT / doc.internal.scaleFactor > cw - 4) fsT -= 0.25;
    doc.setFontSize(fsT); doc.text(tt, cx + cw / 2, M + 4.3, { align: 'center' });
    doc.setTextColor(...TXT); doc.setFontSize(6.8);
    const lineas = [(ent?.razon_social || 'NOMBRE EMPRESA').toUpperCase(), ([ent?.direccion, ent?.ciudad].filter(Boolean).join(', ') || 'DIRECCIÓN Y CIUDAD').toUpperCase(),
      cons ? [cons.sede, cons.nombre].filter(Boolean).join(' - ').toUpperCase() : (ent?.reps ? `CÓDIGO PRESTADOR (REPS): ${ent.reps}` : ''), `NIT: ${ent?.nit || ''}`, `E-MAIL: ${ent?.email || ''}${ent?.telefono ? '   TEL: ' + ent.telefono : ''}`].filter(Boolean);
    lineas.forEach((l, i) => doc.text(doc.splitTextToSize(l, cw - 4)[0], cx + cw / 2, M + 10 + i * 3.6, { align: 'center' }));
    const rx = cx + cw, celdas = [[`CÓDIGO ${fmt.codigo || ''}`, 8.5], [`VERSIÓN ${fmt.version || ''}`, 8.5], ['FECHA APROBACIÓN', 7.5], [fF(fmt.fecha), 8.5]];
    celdas.forEach(([t, fs], i) => {
      const yy = M + i * (h / 4); if (i) doc.line(rx, yy, rx + rw, yy);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(fs); doc.text(t, rx + rw / 2, yy + h / 8 + 1.2, { align: 'center' });
    });
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...TXT);
    return M + h + 3;
  }

  function datosEntidad(doc, y, ent, extra = []) {
    if (!ent) return y;
    return kv(doc, y, [
      ['Nombre empresa', ent.razon_social, 'NIT', ent.nit],
      ['Dirección y ciudad', [ent.direccion, ent.ciudad].filter(Boolean).join(', '), 'Código prestador (REPS)', ent.reps],
      ['E-mail', ent.email, 'Teléfono', ent.telefono],
      ...extra,
    ]);
  }

  function kv(doc, y, rows, opts = {}) {
    const cols = rows[0].length;
    const body = rows.map((r) => r.map((c, i) => (i % 2 === 0
      ? { content: c, styles: { fillColor: GRIS, fontStyle: 'bold', textColor: TXT } }
      : { content: c === undefined || c === null ? '' : String(c) })));
    const ancho = W(doc) - 2 * M;
    const colStyles = {};
    for (let i = 0; i < cols; i++) colStyles[i] = { cellWidth: i % 2 === 0 ? (opts.lab || 34) : (ancho - (cols / 2) * (opts.lab || 34)) / (cols / 2) };
    doc.autoTable({ startY: y, body, theme: 'grid', margin: { left: M, right: M }, styles: { fontSize: 7.5, cellPadding: 1.4, lineColor: LINEA, lineWidth: 0.15, textColor: TXT, overflow: 'linebreak' }, columnStyles: colStyles });
    return doc.lastAutoTable.finalY + (opts.gap ?? 3);
  }

  function seccion(doc, y, t) {
    y = salto(doc, y, 14);
    doc.setFillColor(...BARRA); doc.setDrawColor(...LINEA); doc.setLineWidth(0.2); doc.rect(M, y, W(doc) - 2 * M, 5, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...CYAN);
    doc.text(t.toUpperCase(), W(doc) / 2, y + 3.6, { align: 'center' }); doc.setTextColor(...TXT); doc.setFont('helvetica', 'normal');
    return y + 6.5;
  }

  function tabla(doc, y, head, body, opts = {}) {
    doc.autoTable({
      startY: y, head: [head], body, theme: 'grid', margin: { left: M, right: M, top: 20 },
      headStyles: { fillColor: GRIS, textColor: TEAL, fontStyle: 'bold', fontSize: opts.fs || 7.5, halign: 'center', valign: 'middle', lineColor: LINEA, lineWidth: 0.15 },
      styles: { fontSize: opts.fs || 7.5, cellPadding: 1.3, lineColor: LINEA, lineWidth: 0.15, textColor: TXT, valign: 'middle' }, columnStyles: opts.cols || {}, didParseCell: opts.didParseCell, didDrawCell: opts.didDrawCell,
    });
    return doc.lastAutoTable.finalY + 3;
  }

  function parrafo(doc, y, texto, fs = 9) {
    doc.setFontSize(fs); doc.setFont('helvetica', 'normal'); y += fs * 0.3;
    const l = doc.splitTextToSize(texto || '', W(doc) - 2 * M);
    l.forEach((ln) => { y = salto(doc, y, 6); doc.text(ln, M, y); y += fs * 0.45; });
    return y + 2;
  }

  function salto(doc, y, need) { if (y + need > H(doc) - 22) { doc.addPage(); return M + 4; } return y; }

  function firmas(doc, y, bloques) {
    y = salto(doc, y, 40);
    const ancho = (W(doc) - 2 * M - 10 * (bloques.length - 1)) / bloques.length;
    bloques.forEach((b, i) => {
      const x = M + i * (ancho + 10);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...TEAL); doc.text((b.titulo || '').toUpperCase(), x, y);
      doc.setTextColor(...TXT);
      if (b.img) logo(doc, b.img, x, y + 1, Math.min(55, ancho), 16);
      doc.setDrawColor(120); doc.line(x, y + 19, x + Math.min(70, ancho), y + 19);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(b.nombre || 'Nombre:', x, y + 23);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.2);
      (b.lineas || []).forEach((l, j) => doc.text(l, x, y + 27 + j * 3.6));
    });
    return y + 30 + Math.max(...bloques.map((b) => (b.lineas || []).length)) * 3.6;
  }

  // Pie igual al de los formatos: datos de IBCOL centrados + logo IBCOL + página
  function pie(doc, emp) {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      const w = W(doc), h = H(doc);
      doc.setFontSize(6.5); doc.setTextColor(40); doc.setFont('helvetica', 'normal');
      [`${emp.nombre || 'IBCOL Ingeniería Biomédica de Colombia'}: ${[emp.telefono2, emp.telefono].filter(Boolean).join(' – ')}`, `E-MAIL: ${emp.email || ''}`, `DIRECCIÓN: ${emp.direccion || ''}`, emp.ciudad || 'Popayán - Cauca']
        .forEach((l, k) => doc.text(l, w / 2, h - 15 + k * 2.8, { align: 'center' }));
      logo(doc, window.IBCOL_LOGO, w - M - 26, h - 17, 26, 11);
      doc.setFontSize(6.5); doc.text(`Página ${i} de ${n}`, M, h - 9);
      doc.setTextColor(...TXT);
    }
    return doc;
  }

  const firmaIBCOL = (emp, firma, titulo = 'Elaboró') => ({
    titulo, nombre: emp.responsable, img: firma,
    lineas: [emp.cargo, emp.matricula ? `Matrícula profesional No. ${emp.matricula}` : '', emp.invima ? `Inscripción INVIMA No. ${emp.invima}` : ''].filter(Boolean),
  });

  // ------------------------------------------------------------------ HOJA DE VIDA (réplica del formato FHVEB-001)
  function hojaVida({ eq, ent, cons, emp, fmt, firma }) {
    const doc = nuevo(); const hv = eq.hv || {};
    const LBL = [221, 243, 250], SEC = [217, 217, 217], CY = [0, 150, 190], X0 = M, AN = W(doc) - 2 * M;
    const FS = 5.5, PAD = 0.45;
    const nr = (x) => (x === undefined || x === null || x === '' ? 'NR' : String(x));
    const has = (lista, v) => { const a = Array.isArray(lista) ? lista : lista ? [lista] : []; return a.some((x) => String(x).toLowerCase() === v.toLowerCase()); };
    const ap = (lista, v) => (has(lista, v) ? 'APLICA' : 'NA');
    const span = (o, extra) => { const { colSpan, rowSpan, ...st } = extra; if (colSpan) o.colSpan = colSpan; if (rowSpan) o.rowSpan = rowSpan; Object.assign(o.styles, st); return o; };
    const L = (t, extra = {}) => span({ content: t, styles: { fillColor: LBL, fontStyle: 'bold' } }, extra);
    const V = (t, extra = {}) => span({ content: t === undefined || t === null ? '' : String(t), styles: { halign: 'center' } }, extra);
    const tbl = (y, body, widths, o = {}) => {
      const cs = {}; widths.forEach((w, i) => { cs[i] = { cellWidth: w }; });
      doc.autoTable({ startY: y, body, theme: 'grid', margin: { left: o.left ?? X0, right: o.right ?? M, bottom: 17, top: M }, tableWidth: widths.reduce((a, b) => a + b, 0),
        styles: { fontSize: FS, cellPadding: PAD, lineColor: [60, 60, 60], lineWidth: 0.15, textColor: [20, 20, 20], valign: 'middle', overflow: 'linebreak', minCellHeight: 2.8 }, columnStyles: cs });
      return doc.lastAutoTable.finalY;
    };
    const barra = (y, t, x = X0, w = AN) => {
      doc.setFillColor(...SEC); doc.setDrawColor(60); doc.setLineWidth(0.15); doc.rect(x, y, w, 4, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...CY); doc.text(t, x + w / 2, y + 3, { align: 'center' });
      doc.setTextColor(20); doc.setFont('helvetica', 'normal'); return y + 4;
    };
    const mk = (b) => (b ? 'X' : '');
    const fDT = (s) => fF(s) || 'NR';

    // ---------- Encabezado
    let y = M;
    doc.setDrawColor(60); doc.setLineWidth(0.2);
    const hW = AN * 0.73;
    doc.rect(X0, y, hW, 27); doc.rect(X0 + hW, y, AN - hW, 27);
    doc.setFillColor(...SEC); doc.rect(X0, y, hW, 6, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...CY);
    doc.text((fmt.titulo || 'HOJA DE VIDA DE EQUIPO BIOMÉDICO').toUpperCase(), X0 + hW / 2, y + 4.6, { align: 'center' });
    doc.setTextColor(20); doc.setFontSize(7);
    [(ent?.razon_social || 'NOMBRE EMPRESA').toUpperCase(), [ent?.direccion, ent?.ciudad].filter(Boolean).join(', ').toUpperCase() || 'DIRECCIÓN Y CIUDAD',
      [cons?.sede, cons?.nombre].filter(Boolean).join(' - ').toUpperCase() || 'SEDE O SERVICIO', `NIT: ${ent?.nit || ''}`, `E-MAIL: ${ent?.email || ''}`, `CONTACTO: ${[ent?.representante, ent?.telefono].filter(Boolean).join(' - ')}`]
      .forEach((l, i) => doc.text(l, X0 + hW / 2, y + 9.4 + i * 3.1, { align: 'center' }));
    if (ent?.logo) logo(doc, ent.logo, X0 + hW + 3, y + 3, AN - hW - 6, 21);
    else { doc.setFontSize(7.5); doc.text('LOGO EMPRESA', X0 + hW + (AN - hW) / 2, y + 16, { align: 'center' }); }
    y += 28.5;

    // ---------- 1. Identificación
    y = barra(y, '1. IDENTIFICACIÓN') + 1;
    const tr = hv.tipo_registro || (eq.registro_sanitario ? 'RS' : 'NR');
    y = tbl(y, [
      [L('1.1 REGISTRO SANITARIO O PERMISO DE COMERCIALIZACIÓN'), V(nr(eq.registro_sanitario)), L('RS', { halign: 'center' }), V(mk(tr === 'RS')), L('PC', { halign: 'center' }), V(mk(tr === 'PC')), L('NA', { halign: 'center' }), V(mk(tr === 'NA')), L('NR', { halign: 'center' }), V(mk(tr === 'NR'))],
      [L('1.2 CÓDIGO ECRI'), V(nr(hv.ecri)), L('VENCE REGISTRO', { colSpan: 4 }), V(fF(eq.fecha_venc_rs) || 'NR', { colSpan: 4 })],
      [L('1.3 CÓDIGO DEL PRESTADOR'), V(nr(ent?.reps)), L('1.4 DISTINTIVO DE HABILITACIÓN', { colSpan: 4 }), V(nr(hv.distintivo), { colSpan: 4 })],
    ], [62, 50, 10, 9, 10, 9, 10, 10.9, 10, 11]) + 1;

    // ---------- 2 y 3 con foto a la izquierda
    const fotoW = 48, xR = X0 + fotoW + 2, wR = AN - fotoW - 2;
    y = barra(y, '2. EQUIPO:') + 1; const yFoto = y;
    const c4 = [wR * 0.2, wR * 0.36, wR * 0.2, wR * 0.24];
    y = tbl(y, [
      [L('2.1 FUNCIÓN DEL EQUIPO'), V(nr(hv.funcion), { colSpan: 3 })],
      [L('2.2 MARCA'), V(nr(eq.marca)), L('2.6 ACTIVO FIJO'), V(nr(eq.activo_fijo))],
      [L('2.3 MODELO'), V(nr(eq.modelo)), L('2.7 SERVICIO'), V(nr(cons?.servicio || cons?.nombre))],
      [L('2.4 SERIE'), V(nr(eq.serie)), L('2.8 UBICACIÓN'), V(nr(eq.ubicacion))],
      [L('2.5 INVENTARIO'), V(nr(eq.codigo_inv)), L('2.9 MÓVIL / 2.10 FIJO'), V(hv.movil === 'Fijo' ? 'FIJO: X' : 'MÓVIL: X')],
    ], c4, { left: xR }) + 1;
    y = barra(y, '3. REGISTRO HISTÓRICO', xR, wR) + 1;
    const adq = (hv.adquisicion || 'Compra').toUpperCase();
    const o10 = Array(10).fill(wR / 10);
    y = tbl(y, [
      [L('3.1 FORMA DE ADQUISICIÓN', { colSpan: 10, halign: 'center' })],
      ['COMPRA', 'DONACIÓN', 'ASIGNACIÓN', 'COMODATO', 'ALQUILER'].flatMap((k) => [L(k, { fontSize: 5.4 }), V(mk(adq === k || (k === 'DONACIÓN' && adq === 'DONACION') || (k === 'ASIGNACIÓN' && adq === 'ASIGNACION')))]),
    ], o10, { left: xR });
    y = tbl(y, [
      [L('GARANTÍA'), V(nr(hv.garantia || (eq.fecha_fin_garantia ? 'Hasta ' + fF(eq.fecha_fin_garantia) : ''))), L('COSTO'), V(hv.costo ? pesos(hv.costo) : 'NR')],
      [L('FACTURA'), V(nr(hv.factura)), L('CONTRATO'), V(nr(hv.contrato))],
      [L('FECHA FABRICACIÓN'), V(fDT(hv.f_fabricacion)), L('FECHA COMPRA'), V(fDT(hv.f_compra))],
      [L('FECHA RECIBIDO'), V(fDT(hv.f_recibido)), L('FECHA INSTALACIÓN'), V(fDT(hv.f_instalacion))],
      [L('FECHA PUESTA EN USO'), V(fDT(hv.f_uso)), L('VIDA ÚTIL'), V(nr(hv.vida_util))],
    ], c4, { left: xR }) + 1;
    y = tbl(y, [
      [L('3.2 PROVEEDOR:'), V(nr(hv.prov_nombre)), L('3.3 FABRICANTE:'), V(nr(eq.fabricante))],
      [L('CIUDAD / PAÍS'), V(nr(hv.prov_ciudad)), L('CIUDAD / PAÍS'), V(nr(hv.fab_ciudad))],
      [L('DIRECCIÓN'), V(nr(hv.prov_dir)), L('DIRECCIÓN'), V(nr(hv.fab_dir))],
      [L('TEL / CEL'), V(nr(hv.prov_tel)), L('TEL / CEL'), V(nr(hv.fab_tel))],
      [L('CORREO'), V(nr(hv.prov_correo)), L('CORREO'), V(nr(hv.fab_correo))],
      [L('PÁGINA WEB'), V(nr(hv.prov_web)), L('PÁGINA WEB'), V(nr(hv.fab_web))],
    ], c4, { left: xR });
    doc.setDrawColor(60); doc.setLineWidth(0.2); doc.rect(X0, yFoto, fotoW, y - yFoto);
    if (hv.foto) logo(doc, hv.foto, X0 + 2, yFoto + 2, fotoW - 4, y - yFoto - 4);
    else { doc.setFontSize(6.5); doc.setTextColor(150); doc.text('FOTO DEL EQUIPO', X0 + fotoW / 2, yFoto + (y - yFoto) / 2, { align: 'center' }); doc.setTextColor(20); }
    y += 1;

    // ---------- 4 y 5 lado a lado
    const half = (AN - 6) / 2, c4h = [half * 0.3, half * 0.2, half * 0.3, half * 0.2];
    const tec = (k) => nr(hv[k]);
    const filas45 = [['VOLTAJE (V)', 'voltaje', 'PRESIÓN ATM (Pa)', 'presion_atm'], ['CORRIENTE (A)', 'corriente', 'TEMPERATURA (°C)', 'temperatura'], ['POTENCIA (W)', 'potencia', 'HUMEDAD (%HR)', 'humedad'],
      ['FRECUENCIA (Hz)', 'frecuencia', 'PESO (g, Kg)', 'peso'], ['PRESIÓN (psi, mmhg)', 'presion', 'DIMENSIONES (cm)', 'dimensiones'], ['VELOCIDAD (RPM)', 'rpm', 'OTROS', 'rangos'], ['CAPACIDAD', 'capacidad', 'OTROS', 'otros_tec']]
      .map(([a, ka, b, kb]) => [L(a), V(tec(ka)), L(b), V(tec(kb))]);
    barra(y, '4. REGISTRO TÉCNICO DE INSTALACIÓN', X0, half); barra(y, '5. REGISTRO TÉCNICO DE FUNCIONAMIENTO', X0 + half + 6, half);
    y += 4.6;
    const y4 = tbl(y, filas45, c4h, { left: X0 });
    const y5 = tbl(y, filas45, c4h, { left: X0 + half + 6 });
    y = Math.max(y4, y5) + 1;

    // ---------- 6. Apoyo técnico
    y = barra(y, '6. REGISTRO DE APOYO TÉCNICO') + 1;
    const t3 = (AN - 8) / 3, c3 = [t3 * 0.36, t3 * 0.14, t3 * 0.36, t3 * 0.14];
    const f = hv.fuente, t = hv.tecnologia, cb = hv.clasif_biomedica;
    const b61 = [[L('6.1 FUENTES DE ALIMENTACIÓN', { colSpan: 4, halign: 'center' })], ...[['Electricidad', 'Gas'], ['Batería', 'Vapor'], ['Aceite', 'Oxígeno'], ['Agua', 'Otro'], ['Aire', 'Cuál']].map(([a, b]) => [L(a.toUpperCase()), V(ap(f, a)), L(b.toUpperCase()), V(b === 'Cuál' ? '' : ap(f, b))])];
    const b62 = [[L('6.2 TECNOLOGÍA PREDOMINANTE', { colSpan: 4, halign: 'center' })], ...[['Eléctrico', 'Neumático'], ['Electrónico', 'Acústico'], ['Electromecánico', 'Vapor'], ['Mecánico', 'Solar'], ['Hidráulico', '']].map(([a, b]) => [L(a.toUpperCase()), V(ap(t, a)), L(b.toUpperCase()), V(b ? ap(t, b) : '')])];
    const b63 = [[L('6.3 CLASIFICACIÓN BIOMÉDICA', { colSpan: 2, halign: 'center' })], ...[['Diagnóstico', 'DIAGNÓSTICO'], ['Prevención', 'PREVENCIÓN'], ['Rehabilitación', 'REHABILITACIÓN'], ['Tratamiento y mantenimiento de la vida', 'TTO Y MTO DE LA VIDA'], ['Análisis de laboratorio y apoyo', 'ANÁLISIS DE LABORATORIO Y APOYO']].map(([k, l]) => [L(l), V(ap(cb, k))])];
    const ya = tbl(y, b61, c3, { left: X0 }), yb = tbl(y, b62, c3, { left: X0 + t3 + 4 }), yc = tbl(y, b63, [t3 * 0.75, t3 * 0.25], { left: X0 + 2 * (t3 + 4) });
    y = Math.max(ya, yb, yc) + 1;
    const r = eq.clase_riesgo;
    const b64 = [[L('6.4 CLASIFICACIÓN RIESGO CLÍNICO SEGÚN: DECRETO 4725 DEL 2005', { colSpan: 4, halign: 'center' })], [L('CLASE I'), V(r === 'I' ? 'APLICA' : 'NA'), L('CLASE IIB'), V(r === 'IIb' ? 'APLICA' : 'NA')], [L('CLASE IIA'), V(r === 'IIa' ? 'APLICA' : 'NA'), L('CLASE III'), V(r === 'III' ? 'APLICA' : 'NA')]];
    const b65 = [[L('6.5 MANUALES', { colSpan: 4, halign: 'center' })], [L('OPERACIÓN'), V(ap(hv.manuales, 'Operación')), L('PARTES'), V(ap(hv.manuales, 'Partes'))], [L('MANTENIMIENTO'), V(ap(hv.manuales, 'Mantenimiento')), L('DESPIECE'), V(ap(hv.manuales, 'Despiece'))]];
    const b66 = [[L('6.6 PLANOS', { colSpan: 4, halign: 'center' })], [L('ELECTRÓNICO'), V(ap(hv.planos, 'Electrónico')), L('MECÁNICO'), V(ap(hv.planos, 'Mecánico'))], [L('ELÉCTRICO'), V(ap(hv.planos, 'Eléctrico')), L('NEUMÁTICO'), V(ap(hv.planos, 'Neumático'))]];
    const yd = tbl(y, b64, c3, { left: X0 }), ye = tbl(y, b65, c3, { left: X0 + t3 + 4 }), yf = tbl(y, b66, c3, { left: X0 + 2 * (t3 + 4) });
    y = Math.max(yd, ye, yf) + 1;

    // ---------- 7. Accesorios
    y = barra(y, '7. COMPONENTES Y / O ACCESORIOS') + 1;
    const acc = (hv.accesorios || []).filter((a) => a.nombre);
    const filasAcc = acc.map((a) => [V(a.nombre), V(nr(a.marca)), V(nr(a.modelo)), V(nr(a.serie)), V(nr(a.desc))]);
    while (filasAcc.length < 4) filasAcc.push(['NR', 'NR', 'NR', 'NR', 'NR'].map((x) => V(x)));
    y = tbl(y, [['NOMBRE', 'MARCA', 'MODELO', 'SERIE', 'DESCRIPCIÓN'].map((x) => L(x, { halign: 'center' })), ...filasAcc], Array(5).fill(AN / 5)) + 1;

    // ---------- 8. Documentos anexos
    y = barra(y, '8. DOCUMENTOS ANEXOS') + 1;
    const anexos = hv.anexos || {};
    const docs8 = [['8.1', 'COPIA REGISTRO SANITARIO O PERMISO DE COMERCIALIZACIÓN', 'reg_sanitario'], ['8.2', 'COPIA REGISTRO DE IMPORTACIÓN', 'importacion'], ['8.3', 'COPIA FACTURA O CONTRATO', 'factura'],
      ['8.4', 'COPIA INGRESO ALMACÉN O ACTA DE RECIBIDO A SATISFACCIÓN', 'acta_recibido'], ['8.5', 'CRONOGRAMA DE MANTENIMIENTO POR EL TIEMPO DE GARANTÍA', 'crono_garantia'], ['8.6', 'PROTOCOLO DE MANTENIMIENTO PREVENTIVO DEL FABRICANTE', 'protocolo'], ['8.7', 'GUÍA RÁPIDA DE OPERACIÓN', 'guia']];
    y = tbl(y, [['N°', 'DOCUMENTOS', 'ANEXO', 'NO ANEXO', 'NO APLICA', 'OBSERVACIONES'].map((x) => L(x, { halign: 'center' })),
      ...docs8.map(([n, d, k]) => { const v = anexos[k] || 'No aplica'; return [L(n, { halign: 'center' }), L(d), V(mk(v === 'Anexo')), V(mk(v === 'No anexo')), V(mk(v === 'No aplica')), V('')]; })],
    [10, 92, 15, 16, 16, AN - 149]) + 1;

    // ---------- 9. Programación
    y = barra(y, '9. PROGRAMACIÓN DE MANTENIMIENTO Y METROLOGÍA') + 1;
    const mtoAp = eq.periodicidad_mto && eq.periodicidad_mto !== 'No aplica', metAp = eq.periodicidad_metro && eq.periodicidad_metro !== 'No aplica';
    const rest = AN - 108;
    y = tbl(y, [
      [L('9.1 MANTENIMIENTO PREVENTIVO'), L('APLICA'), V(mk(mtoAp)), L('NO APLICA'), V(mk(!mtoAp)), L('9.5 RECOMENDACIONES PARA MEDICIONES (CANTIDAD / UNIDAD DE MEDIDA)', { halign: 'center' })],
      [L('9.2 PERIODICIDAD DEL MANTENIMIENTO PREVENTIVO'), V((eq.periodicidad_mto || 'NA').toUpperCase(), { colSpan: 4 }), V(nr(hv.mediciones), { rowSpan: 3 })],
      [L('9.3 METROLOGÍA'), L('APLICA'), V(mk(metAp)), L('NO APLICA'), V(mk(!metAp))],
      [L('9.4 PERIODICIDAD DE METROLOGÍA'), V(metAp ? eq.periodicidad_metro.toUpperCase() : 'NA', { colSpan: 4 })],
    ], [56, 14, 10, 16, 12, rest]);

    // ---------- Página 2
    doc.addPage(); y = M;
    y = tbl(y, [[L('EQUIPO', { halign: 'center' }), V(eq.nombre), L('MARCA', { halign: 'center' }), V(nr(eq.marca)), L('MODELO', { halign: 'center' }), V(nr(eq.modelo)), L('SERIE', { halign: 'center' }), V(nr(eq.serie))]],
      [16, 32, 16, 32, 16, 32, 16, AN - 160]) + 1.5;
    y = barra(y, '10. RECOMENDACIONES DEL FABRICANTE') + 1;
    const nL = 13, alto = 4.4;
    doc.setDrawColor(60); doc.setLineWidth(0.15); doc.rect(X0, y, AN, nL * alto);
    for (let i = 1; i < nL; i++) doc.line(X0, y + i * alto, X0 + AN, y + i * alto);
    doc.setFontSize(7); doc.splitTextToSize(hv.recomendaciones || '', AN - 4).slice(0, nL).forEach((ln, i) => doc.text(ln, X0 + 2, y + i * alto + 3.2));
    y += nL * alto + 2;
    const hx = (AN - 6) / 2;
    barra(y, '11. CONVENCIONES', X0, hx); barra(y, '12. ELABORÓ', X0 + hx + 6, hx); y += 5;
    tbl(y, [['RS', 'Registro Sanitario', 'TTO', 'Tratamiento'], ['PC', 'Permiso de comercialización', 'MTO', 'Mantenimiento'], ['NR', 'No registra', 'N°', 'Número'], ['NA', 'No aplica', 'RPM', 'Revoluciones por minuto']]
      .map(([a, b, c, d]) => [L(a, { halign: 'center' }), b, L(c, { halign: 'center' }), d]), [hx * 0.12, hx * 0.38, hx * 0.12, hx * 0.38], { left: X0 });
    const x12 = X0 + hx + 6, w1 = hx * 0.5;
    const y12 = tbl(y, [[L('NOMBRE', { halign: 'center' })], [V((emp.responsable || '').toUpperCase())], [L('FIRMA', { halign: 'center' })], [{ content: '', styles: { minCellHeight: 18 } }]], [w1], { left: x12 });
    if (firma) logo(doc, firma, x12 + 2, y + 11.5, w1 - 4, 14);
    doc.setDrawColor(60); doc.setLineWidth(0.15); doc.rect(x12 + w1, y, hx - w1, y12 - y);
    doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(8.5); doc.text(emp.responsable || '', x12 + w1 + (hx - w1) / 2, y + 7, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    [emp.cargo || '', emp.matricula ? `M.P ${emp.matricula}` : '', emp.invima ? `REG. INVIMA ${emp.invima}` : ''].forEach((l, i) => doc.text(l, x12 + w1 + (hx - w1) / 2, y + 12 + i * 4, { align: 'center' }));

    // ---------- Pie de página como el formato
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); const h = H(doc); doc.setFontSize(5.8); doc.setTextColor(40);
      [`Código: ${fmt.codigo || 'FHVEB-001'}`, `Fecha Act: ${fF(fmt.fecha)}`, `Versión: ${fmt.version || ''}`, `Página ${i} de ${n}`].forEach((l, k) => doc.text(l, X0 + 25, h - 14 + k * 2.5, { align: 'center' }));
      [emp.nombre || '', `Contactos: ${[emp.telefono2, emp.telefono].filter(Boolean).join(' – ')}`, `E-MAIL: ${emp.email || ''}`, `DIRECCIÓN: ${emp.direccion || ''}`, emp.ciudad || ''].forEach((l, k) => doc.text(l, W(doc) / 2, h - 14 + k * 2.5, { align: 'center' }));
      logo(doc, window.IBCOL_LOGO, W(doc) - M - 28, h - 15.5, 26, 11);
      doc.setTextColor(...TXT);
    }
    return doc;
  }

  // ------------------------------------------------------------------ INVENTARIO
  function inventario({ ent, equipos, consultorios, emp, fmt, cons }) {
    const doc = nuevo('l');
    let y = encabezado(doc, { titulo: fmt.titulo, fmt, ent });
    y = datosEntidad(doc, y, ent, [['Sede o servicio', cons ? cons.nombre : 'Todos los servicios', 'Fecha actualización', fF(new Date().toISOString())]]);
    const cn = (id) => consultorios.find((c) => c.id === id)?.nombre || '';
    y = tabla(doc, y, ['Ítem', 'Código de inv.', 'N° de A.F.', 'Equipo', 'Marca', 'Modelo', 'Serie', 'Ubicación / área', 'Clasif. riesgo', 'Registro sanitario', 'Estado'],
      equipos.map((e, i) => [i + 1, e.codigo_inv, e.activo_fijo || '', e.nombre, e.marca || '', e.modelo || '', e.serie || '', [cn(e.consultorio_id), e.ubicacion].filter(Boolean).join(' / '), e.clase_riesgo || '', e.registro_sanitario || '', e.estado]),
      { cols: { 0: { cellWidth: 10, halign: 'center' } } });
    firmas(doc, y + 4, [firmaIBCOL(emp, null)]);
    return pie(doc, emp);
  }

  // ------------------------------------------------------------------ CRONOGRAMA
  function cronograma({ ent, tipo, anio, cronos, equipos, emp, fmt }) {
    const doc = nuevo('l');
    const titulos = { mantenimiento: 'Cronograma de mantenimiento preventivo', metrologia: 'Cronograma de metrología y calibración', capacitacion: 'Cronograma de capacitación' };
    let y = encabezado(doc, { titulo: titulos[tipo], fmt, ent });
    y = datosEntidad(doc, y, ent, [['Responsable', emp.responsable, 'Año', String(anio)]]);
    const eqs = (id) => equipos.find((e) => e.id === id) || {};
    const head1 = tipo === 'capacitacion' ? ['Ítem', 'Tema / equipo'] : ['Ítem', 'Cód. inv.', 'Equipo', 'Marca', 'Modelo', 'Serie'];
    const fijas = head1.length;
    const head = [...head1]; CAT.MESES.forEach((m) => { for (let s = 1; s <= 4; s++) head.push(s === 1 ? m.slice(0, 3).toUpperCase() : ''); });
    const body = cronos.map((c, i) => {
      const e = eqs(c.equipo_id);
      const base = tipo === 'capacitacion' ? [i + 1, c.tema || e.nombre || ''] : [i + 1, e.codigo_inv || '', e.nombre || '', e.marca || '', e.modelo || '', e.serie || ''];
      for (let m = 1; m <= 12; m++) for (let s = 1; s <= 4; s++) base.push((c.plan || {})[`${m}-${s}`] || '');
      return base;
    });
    const cols = {}; for (let k = fijas; k < head.length; k++) cols[k] = { cellWidth: 3.3, halign: 'center', fontSize: 5.5, cellPadding: 0.3 };
    cols[0] = { cellWidth: 7, halign: 'center' };
    doc.autoTable({
      startY: y, head: [head], body, theme: 'grid', margin: { left: M, right: M },
      headStyles: { fillColor: CYAN, textColor: 255, fontSize: 5.5, cellPadding: 0.6, halign: 'left' },
      styles: { fontSize: 6, cellPadding: 0.8, lineColor: [175, 182, 188], lineWidth: 0.12, overflow: 'linebreak' }, columnStyles: cols,
      didParseCell: (d) => {
        if (d.section === 'body' && d.column.index >= fijas) {
          const val = d.cell.raw;
          if (val === 'P') d.cell.styles.fillColor = [255, 214, 102];
          if (val === 'E') d.cell.styles.fillColor = [95, 190, 120];
          if (val === 'N') d.cell.styles.fillColor = [235, 110, 100];
          d.cell.text = [''];
        }
      },
    });
    y = doc.lastAutoTable.finalY + 4;
    const ley = [['P', [255, 214, 102], 'Programado'], ['E', [95, 190, 120], 'Ejecutado'], ['N', [235, 110, 100], 'No ejecutado / reprogramado']];
    doc.setFontSize(7.5); ley.forEach(([, col, t], i) => { doc.setFillColor(...col); doc.rect(M + i * 55, y, 4, 4, 'F'); doc.text(t, M + 6 + i * 55, y + 3.2); });
    firmas(doc, y + 10, [firmaIBCOL(emp, null), { titulo: 'Aprobó', nombre: ent?.representante || 'Nombre:', lineas: ['Representante legal / coordinador'] }]);
    return pie(doc, emp);
  }

  // ------------------------------------------------------------------ MANTENIMIENTOS
  function mantenimiento({ m, eq, ent, cons, emp, fmt, firma }) {
    const doc = nuevo(); const d = m.datos || {};
    let y = encabezado(doc, { titulo: fmt.titulo, fmt, ent });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...TEAL);
    doc.text(`REPORTE N° ${m.numero || ''}`, W(doc) - M, y + 1, { align: 'right' }); doc.setTextColor(...TXT); y += 4;
    y = seccion(doc, y, '1. Identificación');
    y = kv(doc, y, [
      ['Nombre del equipo', eq.nombre, '1.1 Entidad', ent?.razon_social],
      ['1.2 Sede', v(cons?.sede), '1.3 Servicio', v(cons?.nombre)],
      ['1.4 Marca', v(eq.marca), '1.5 Modelo', v(eq.modelo)],
      ['1.6 Serie', v(eq.serie), '1.8 Fecha', fF(m.fecha)],
      ['1.7 Frecuencia', v(d.frecuencia || eq.periodicidad_mto), '1.9 Tiempo', v(d.tiempo || (d.horas ? d.horas + ' h' : ''))],
      ['1.10 Cód. INV', v(eq.codigo_inv), '1.11 Cód. AF', v(eq.activo_fijo)],
    ]);
    if (m.tipo === 'correctivo') {
      y = seccion(doc, y, '2. Descripción de la falla');
      y = kv(doc, y, [['Fecha reporte', fF(d.fecha_reporte), 'Fecha cierre', fF(d.fecha_cierre)], ['Falla reportada', v(d.falla), 'Causa', v(d.causa)], ['Diagnóstico', v(d.diagnostico), 'Horas de trabajo', v(d.horas)]]);
      y = seccion(doc, y, 'Actividades realizadas');
      y = tabla(doc, y, ['N°', 'Actividad'], (d.actividades || []).map((a, i) => [i + 1, a]), { cols: { 0: { cellWidth: 10, halign: 'center' } } });
    } else if (m.tipo === 'metrologia') {
      y = seccion(doc, y, '2. Calibración / verificación metrológica');
      y = kv(doc, y, [['Laboratorio', v(d.laboratorio), 'Certificado N°', v(d.certificado)], ['Magnitud', v(d.magnitud), 'Resultado', v(d.resultado)], ['Fecha calibración', fF(m.fecha), 'Próxima calibración', fF(d.proxima)]]);
    } else {
      y = seccion(doc, y, '2. Puntos de inspección y mantenimiento');
      const pr = d.pruebas || [], ac = d.actividades || [], n = Math.max(pr.length, ac.length, 1);
      const body = []; for (let i = 0; i < n; i++) body.push([pr[i]?.item || '', pr[i]?.r === 'Pasa' ? 'X' : '', pr[i]?.r === 'No pasa' ? 'X' : '', ac[i] || '']);
      y = tabla(doc, y, ['Pruebas cualitativas', 'Pasa', 'No pasa', 'Actividades de mantenimiento'], body, { cols: { 1: { cellWidth: 13, halign: 'center' }, 2: { cellWidth: 15, halign: 'center' } } });
    }
    y = seccion(doc, y, '3. Estado de valoración');
    const val = d.valoracion || [];
    const vr = []; for (let i = 0; i < CAT.VALORACION.length; i += 2) vr.push([val.includes(CAT.VALORACION[i]) ? '✓' : 'x', CAT.VALORACION[i], val.includes(CAT.VALORACION[i + 1]) ? '✓' : 'x', CAT.VALORACION[i + 1]]);
    doc.autoTable({ startY: y, body: vr.map((r) => r.map((c, i) => (i % 2 === 0 ? (c === '✓' ? 'SI' : '—') : c))), theme: 'grid', margin: { left: M, right: M }, styles: { fontSize: 7.5, cellPadding: 1.2, lineColor: [175, 182, 188], lineWidth: 0.15 }, columnStyles: { 0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' }, 2: { cellWidth: 10, halign: 'center', fontStyle: 'bold' } },
      didParseCell: (c) => { if ((c.column.index === 0 || c.column.index === 2) && c.cell.raw === 'SI') c.cell.styles.textColor = [30, 140, 80]; } });
    y = doc.lastAutoTable.finalY + 3;
    if (m.tipo !== 'metrologia') {
      y = seccion(doc, y, '4. Herramienta - insumo - repuestos');
      const h = d.herramientas || [];
      y = kv(doc, y, [['Herramientas e insumos', h.length ? h.join(', ') : 'NA', 'Partes utilizadas', (d.repuestos || []).length ? d.repuestos.map((r) => `${r.c || 1} × ${r.d}`).join('; ') : 'NA']]);
    }
    y = seccion(doc, y, '5. Observaciones generales');
    y = parrafo(doc, y, d.observaciones || 'Sin observaciones.', 8.5);
    firmas(doc, y + 3, [
      { titulo: 'Recibido a satisfacción', nombre: d.recibe_nombre || 'Nombre:', img: m.firma_recibe, lineas: [d.recibe_cargo || 'Cargo:'] },
      { ...firmaIBCOL(emp, m.firma_realizo || firma, 'Realizó') },
    ]);
    return pie(doc, emp);
  }

  // ------------------------------------------------------------------ ALERTAS
  function alertas({ ent, alertas, emp, fmt }) {
    const doc = nuevo('l');
    let y = encabezado(doc, { titulo: fmt.titulo, fmt, ent });
    y = tabla(doc, y, ['No.', 'Mes de consulta', 'Registro sanitario / permiso', 'Nombre del dispositivo', 'Tipo de notificación', 'Agencia sanitaria', 'Fecha publicación', 'Responsable', 'Análisis', 'Aplicabilidad'],
      alertas.map((a, i) => [i + 1, a.mes_consulta || '', a.registro_sanitario || '', a.dispositivo || '', a.tipo_notificacion || '', a.agencia || '', fF(a.fecha_publicacion), a.responsable || '', a.analisis || '', a.aplicabilidad || '']),
      { cols: { 0: { cellWidth: 9, halign: 'center' }, 8: { cellWidth: 52 } } });
    firmas(doc, y + 4, [firmaIBCOL(emp, null, 'Elaborado por')]);
    return pie(doc, emp);
  }

  // ------------------------------------------------------------------ EVENTO ADVERSO
  function evento({ ev, eq, ent, emp, fmt }) {
    const doc = nuevo();
    let y = encabezado(doc, { titulo: fmt.titulo, fmt, ent });
    y = seccion(doc, y, 'A. Datos del reporte');
    y = kv(doc, y, [['Fecha y hora', new Date(ev.fecha_evento).toLocaleString('es-CO'), 'Servicio', v(ev.servicio)], ['Reportante', v(ev.reportante), 'Cargo', v(ev.cargo)], ['Estado del reporte', ev.estado, 'Plazo de notificación', ['Muerte', 'Deterioro grave'].includes(ev.consecuencia) ? 'Reporte inmediato (máx. 72 h)' : 'Reporte periódico']]);
    y = seccion(doc, y, 'B. Dispositivo médico');
    y = kv(doc, y, [['Equipo', v(eq?.nombre), 'Código inv.', v(eq?.codigo_inv)], ['Marca', v(eq?.marca), 'Modelo', v(eq?.modelo)], ['Serie', v(eq?.serie), 'Registro sanitario', v(eq?.registro_sanitario)]]);
    y = seccion(doc, y, 'C. Descripción y gravedad');
    y = kv(doc, y, [['¿Afectó al paciente?', ev.afecto_paciente ? 'Sí' : 'No', 'Consecuencia', v(ev.consecuencia)]]);
    y = parrafo(doc, y, ev.descripcion, 8.5);
    y = seccion(doc, y, 'D. Acciones inmediatas');
    y = kv(doc, y, [['Retiro del equipo', ev.retiro_equipo ? 'Sí' : 'No', 'Contingencia', v(ev.contingencia)]]);
    firmas(doc, y + 4, [{ titulo: 'Reportó', nombre: ev.reportante, lineas: [ev.cargo || ''] }, firmaIBCOL(emp, null, 'Analizó')]);
    return pie(doc, emp);
  }

  // ------------------------------------------------------------------ ACTAS
  function acta({ tipo, a, ent, emp, fmt, firma }) {
    const doc = nuevo();
    let y = encabezado(doc, { titulo: fmt.titulo, fmt, ent });
    doc.setFontSize(9.5);
    doc.text(`Popayán, ${fLarga(a.fecha)}.`, M, y + 3);
    // recuadro "Consecutivo / ACTA No." como en el formato Word
    const bx = W(doc) - M - 50; doc.setDrawColor(...LINEA); doc.setLineWidth(0.2);
    doc.setFillColor(...GRIS); doc.rect(bx, y - 2, 50, 5, 'FD'); doc.rect(bx, y + 3, 25, 6); doc.rect(bx + 25, y + 3, 25, 6);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text('Consecutivo', bx + 25, y + 1.8, { align: 'center' });
    doc.text('ACTA No.', bx + 12.5, y + 7.2, { align: 'center' }); doc.setFontSize(9.5); doc.text(String(a.numero || ''), bx + 37.5, y + 7.2, { align: 'center' });
    y += 13; doc.text('Señores:', M, y); doc.setFont('helvetica', 'normal'); y += 5;
    [ent?.razon_social, ent?.representante, ent?.nit ? 'NIT ' + ent.nit : '', ent?.direccion, ent?.email].filter(Boolean).forEach((l) => { doc.text(l, M, y); y += 4.4; });
    y += 3; doc.setFont('helvetica', 'bold'); doc.text(`Asunto: ${tipo === 'baja' ? 'ACTA DE BAJA' : 'ACTA DE ENTREGA'}.`, M, y); doc.setFont('helvetica', 'normal'); y += 7;
    if (tipo === 'entrega') { doc.text('Cordial saludo.', M, y); y += 6; }
    const n = a.equipos.length, nombres = [...new Set(a.equipos.map((e) => e.nombre.toLowerCase()))].join(', ');
    const texto = a.texto || (tipo === 'baja'
      ? `Con la presente se da de baja ${String(n).padStart(2, '0')} ${n === 1 ? 'equipo' : 'equipos'} (${nombres}). ${a.motivo || 'Este equipo biomédico no pasó calibración y por tanto se debe sacar del servicio y reemplazarlo por otro de mejores o iguales condiciones.'}`
      : `Con la presente acta se hace entrega de ${String(n).padStart(2, '0')} ${n === 1 ? 'equipo' : 'equipos'} (${nombres}), al servicio de ${a.servicio || '________'}, con el fin de prestar un servicio de calidad. A continuación se relacionan los equipos que se entregan:`);
    y = parrafo(doc, y, texto, 9.5);
    y = tabla(doc, y, ['Código inv.', 'Equipo', 'Marca', 'Modelo', 'Serie'], a.equipos.map((e) => [e.codigo_inv, e.nombre, e.marca || '', e.modelo || '', e.serie || '']), { fs: 8 });
    if (tipo === 'baja') y = parrafo(doc, y, 'Se solicitó autorización de gerencia para realizar dicho cambio y realizar la compra de nuevos equipos.', 9.5);
    y = parrafo(doc, y, tipo === 'baja' ? 'De antemano agradezco su atención prestada.' : 'De antemano agradezco su atención prestada, quedo atenta ante cualquier inquietud o solicitud requerida.', 9.5);
    doc.setFontSize(9.5); doc.text('Cordialmente,', M, y + 2);
    firmas(doc, y + 8, [firmaIBCOL(emp, firma, ''), { titulo: 'Recibe', nombre: a.recibe_nombre || 'Nombre:', img: a.firma_recibe, lineas: [`Cargo: ${a.recibe_cargo || ''}`, `Fecha: ${fF(a.fecha)}`] }]);
    return pie(doc, emp);
  }

  // ------------------------------------------------------------------ COTIZACIÓN
  function cotizacion({ c, ent, emp, fmt, firma }) {
    const doc = nuevo();
    let y = encabezado(doc, { titulo: fmt.titulo, fmt, ent });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...TEAL);
    doc.text(`COTIZACIÓN ${c.numero}`, M, y + 4); doc.setTextColor(...TXT);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`Popayán, ${fLarga(c.fecha)}`, W(doc) - M, y + 4, { align: 'right' }); y += 9;
    y = kv(doc, y, [['Cliente', ent?.razon_social || '', 'NIT', ent?.nit || ''], ['Atención', ent?.representante || '', 'Ciudad', ent?.ciudad || ''], ['Correo', ent?.email || '', 'Validez', `${c.validez_dias || 30} días`]]);
    const sub = (c.items || []).reduce((s, i) => s + (Number(i.cantidad) || 0) * (Number(i.valor) || 0), 0);
    const iva = sub * (Number(c.iva) || 0) / 100;
    y = tabla(doc, y, ['Ítem', 'Descripción', 'Cant.', 'Valor unitario', 'Valor total'],
      (c.items || []).map((i, k) => [k + 1, i.descripcion, i.cantidad, pesos(i.valor), pesos((Number(i.cantidad) || 0) * (Number(i.valor) || 0))]),
      { cols: { 0: { cellWidth: 10, halign: 'center' }, 2: { cellWidth: 14, halign: 'center' }, 3: { cellWidth: 30, halign: 'right' }, 4: { cellWidth: 32, halign: 'right' } } });
    const tot = [['Subtotal', pesos(sub)], [`IVA ${Number(c.iva) || 0}%`, pesos(iva)], ['TOTAL', pesos(sub + iva)]];
    doc.autoTable({ startY: y - 2, body: tot, theme: 'grid', margin: { left: W(doc) - M - 72, right: M }, styles: { fontSize: 8.5, cellPadding: 1.4 }, columnStyles: { 0: { fontStyle: 'bold', fillColor: GRIS }, 1: { halign: 'right' } },
      didParseCell: (d) => { if (d.row.index === 2) { d.cell.styles.fillColor = TEAL; d.cell.styles.textColor = 255; d.cell.styles.fontStyle = 'bold'; } } });
    y = doc.lastAutoTable.finalY + 5;
    doc.setFontSize(8.5); doc.text(`Son: ${enLetras(sub + iva)} pesos m/cte.`, M, y); y += 6;
    y = seccion(doc, y, 'Condiciones comerciales');
    y = parrafo(doc, y, c.condiciones || '', 8.5);
    firmas(doc, y + 4, [firmaIBCOL(emp, firma, 'Atentamente')]);
    return pie(doc, emp);
  }

  // ------------------------------------------------------------------ CUENTA DE COBRO (formato IBCOL No. 00306-2026)
  function cuentaCobro({ cc, ent, emp }) {
    const doc = nuevo(); const w = W(doc), cx = w / 2, L = 25, R = w - 25;
    const titular = emp.cobro_titular || emp.responsable || '';
    const docId = emp.cobro_documento || emp.cedula || '';
    const firma = emp.firma_cobro || null;
    const items = (cc.items || []).filter((i) => i.descripcion);
    const total = items.length ? items.reduce((s, i) => s + (Number(i.cantidad) || 1) * (Number(i.valor) || 0), 0) : Number(cc.total) || 0;
    const fNum = (n) => Math.round(Number(n) || 0).toLocaleString('es-CO');
    // Encabezado: datos del titular + logo IBCOL
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(titular.toUpperCase(), cx - 10, 22, { align: 'center' });
    doc.text(`ID: NIT: ${docId}`, cx - 10, 26.5, { align: 'center' });
    doc.text(`CEL.: ${emp.telefono || ''}`, cx - 10, 31, { align: 'center' });
    doc.setFontSize(8.5); doc.setTextColor(90); doc.text(`E-MAIL: ${emp.email || ''}`, cx - 10, 35.5, { align: 'center' }); doc.setTextColor(...TXT);
    logo(doc, window.IBCOL_LOGO, R - 42, 14, 42, 26);
    // Ciudad, fecha y número
    const d = new Date((cc.fecha || UI.hoy()) + 'T12:00:00');
    const ff = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`CIUDAD Y FECHA:    ${(emp.cobro_ciudad || 'POPAYÁN').toUpperCase()} – (${ff})`, cx - 20, 48, { align: 'center' });
    doc.text(`CUENTA DE COBRO No: (${cc.numero || ''})`, R, 57, { align: 'right' });
    // Datos de la empresa deudora
    let y = 70;
    [(ent?.razon_social || 'DATOS EMPRESA').toUpperCase(), `ID: N.I. ${ent?.nit || ''}`, `DIR: ${[ent?.direccion, ent?.ciudad].filter(Boolean).join(', ')}`, `TEL.: ${ent?.telefono || ''}  E-MAIL: ${ent?.email || ''}`]
      .forEach((l) => { doc.splitTextToSize(l, 140).forEach((ln) => { doc.text(ln, cx, y, { align: 'center' }); y += 4.6; }); });
    y += 5; doc.text('DEBE A:', cx, y, { align: 'center' }); y += 5;
    doc.setFont('helvetica', 'bold'); doc.text(titular.toUpperCase(), cx, y, { align: 'center' }); y += 14;
    // Valor
    doc.text('LA SUMA DE:', L, y); doc.text(`$ ${fNum(total)}`, L + 45, y); y += 5;
    doc.text('VALOR EN LETRAS:', L, y);
    const letras = doc.splitTextToSize(`${enLetras(total).toUpperCase()} PESOS M/C.`, R - L - 47);
    doc.text(letras, L + 47, y); y += letras.length * 4.6 + 7;
    // Concepto
    doc.setFontSize(9); doc.text('POR CONCEPTO DE:', L, y); doc.setFontSize(10);
    const xc = L + 47, ancho = R - xc;
    const lineas = items.length
      ? items.map((it, k) => `${k + 1}. ${it.descripcion}${Number(it.cantidad) > 1 ? ` (${it.cantidad} × $ ${fNum(it.valor)})` : ''} (VALOR $ ${fNum((Number(it.cantidad) || 1) * (Number(it.valor) || 0))})`)
      : [`1. ${cc.concepto || ''}`];
    if (items.length && cc.concepto) lineas.unshift(cc.concepto);
    lineas.forEach((t) => {
      const [num, ...resto] = t.match(/^\d+\.\s/) ? [t.match(/^\d+\.\s/)[0], t.replace(/^\d+\.\s/, '')] : ['', t];
      const ls = doc.splitTextToSize((resto.join('') || '').toUpperCase(), ancho - (num ? 5 : 0));
      if (num) { doc.setFont('helvetica', 'bold'); doc.text(num.trim(), xc, y); }
      doc.setFont('helvetica', 'normal');
      ls.forEach((ln) => { y = salto(doc, y, 8); doc.text(ln, xc + (num ? 5 : 0), y); y += 4.6; });
      y += 1.5;
    });
    // Datos para el pago
    y = Math.max(y + 18, 150); y = salto(doc, y, 70);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    const pago = [['DATOS PARA EL PAGO:', ''], ['NÚMERO DE CUENTA:', emp.numero_cuenta || ''], ['TIPO DE CUENTA:', (emp.tipo_cuenta ? `CUENTA DE ${emp.tipo_cuenta}` : '').toUpperCase()], ['NOMBRE DEL BANCO:', (emp.banco || '').toUpperCase()], ['BENEFICIARIO DEL PAGO:', titular.toUpperCase()]];
    pago.forEach(([k, val]) => { doc.setFont('helvetica', 'bold'); doc.text(k, L, y); doc.setFont('helvetica', 'normal'); doc.text(String(val), L + 47, y); y += 4.4; });
    // Firma
    y += 16;
    if (firma) logo(doc, firma, cx - 32, y - 2, 64, 20);
    doc.setDrawColor(60); doc.line(cx - 35, y + 17, cx + 35, y + 17);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(titular.toUpperCase(), cx, y + 22, { align: 'center' });
    doc.text(`CC.: ${docId}${emp.cobro_expedicion ? ' de ' + emp.cobro_expedicion : ''}.`, cx, y + 27, { align: 'center' });
    // Pie IBCOL
    const h = H(doc); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(40, 90, 140);
    [`${emp.nombre || 'IBCOL Ingeniería Biomédica de Colombia'}:  ${emp.telefono || ''}`, `E-MAIL: ${emp.email || ''}`, `DIRECCIÓN: ${emp.direccion || ''}`, emp.ciudad || ''].forEach((l, k) => doc.text(l, cx, h - 22 + k * 3.6, { align: 'center' }));
    doc.setTextColor(...TXT);
    return doc;
  }

  // ------------------------------------------------------------------ INDICADORES
  function indicadores({ ent, k, emp, anio }) {
    const doc = nuevo();
    let y = encabezado(doc, { titulo: 'Gestión de indicadores de tecnología biomédica', fmt: { codigo: 'FT-IND-001', version: '001', fecha: `${anio}-01-01` }, ent });
    y = tabla(doc, y, ['Indicador', 'Fórmula', 'Resultado', 'Meta', 'Estado'], k.map((x) => [x.nombre, x.formula, x.valor, x.meta, x.ok === null ? 'Sin datos' : x.ok ? 'Cumple' : 'No cumple'].map((t) => String(t).replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/Σ/g, 'Suma de'))),
      { cols: { 2: { halign: 'center', cellWidth: 22 }, 3: { halign: 'center', cellWidth: 20 }, 4: { halign: 'center', cellWidth: 22 } },
        didParseCell: (d) => { if (d.section === 'body' && d.column.index === 4) d.cell.styles.textColor = d.cell.raw === 'Cumple' ? [30, 140, 80] : d.cell.raw === 'No cumple' ? [190, 50, 40] : [120, 120, 120]; } });
    firmas(doc, y + 6, [firmaIBCOL(emp, null)]);
    return pie(doc, emp);
  }

  // ------------------------------------------------------------------ DOCUMENTO LIBRE (redactado con IA o a mano)
  function documento({ titulo, texto, ent, emp, fmt = {}, firma }) {
    const doc = nuevo();
    let y = encabezado(doc, { titulo, fmt, ent });
    const w = W(doc) - 2 * M;
    const limpio = (t) => String(t).replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').replace(/`/g, '').replace(/[≥]/g, '>=').replace(/[≤]/g, '<=').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, '-').replace(/[•●▪]/g, '-');
    const lineas = String(texto || '').replace(/\r/g, '').split('\n');
    let tabla = [];
    const volcarTabla = () => {
      if (!tabla.length) return;
      const filas = tabla.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r)).map((r) => r.replace(/^\s*\||\|\s*$/g, '').split('|').map((c) => limpio(c.trim())));
      if (filas.length) { const [head, ...body] = filas; y = salto(doc, y, 14); y = tabla_(doc, y, head, body.length ? body : [head.map(() => '')]); }
      tabla = [];
    };
    const tabla_ = (d, yy, head, body) => { const n = head.length; return (body = body.map((r) => { while (r.length < n) r.push(''); return r.slice(0, n); }), tablaFn(d, yy, head, body)); };
    for (const raw of lineas) {
      const l = raw.trimEnd();
      if (/^\s*\|/.test(l)) { tabla.push(l); continue; }
      volcarTabla();
      if (!l.trim()) { y += 1.5; continue; }
      let m;
      if ((m = l.match(/^#{1,2}\s+(.*)/))) { y = seccion(doc, y + 1, limpio(m[1])); continue; }
      if ((m = l.match(/^#{3,6}\s+(.*)/))) { y = salto(doc, y, 10); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...TEAL); doc.text(doc.splitTextToSize(limpio(m[1]), w), M, y + 3); doc.setTextColor(...TXT); doc.setFont('helvetica', 'normal'); y += 6; continue; }
      if ((m = l.match(/^(\s*)[-*+]\s+(.*)/))) {
        const ind = Math.min(3, Math.floor(m[1].length / 2)) * 4;
        doc.setFontSize(9); const ls = doc.splitTextToSize(limpio(m[2]), w - 6 - ind);
        ls.forEach((t, i) => { y = salto(doc, y, 6); if (!i) doc.text('•', M + 1.5 + ind, y + 3); doc.text(t, M + 5.5 + ind, y + 3); y += 4.2; });
        y += 0.6; continue;
      }
      if ((m = l.match(/^(\s*)(\d+[.)])\s+(.*)/))) {
        const ind = Math.min(3, Math.floor(m[1].length / 2)) * 4;
        doc.setFontSize(9); const ls = doc.splitTextToSize(limpio(m[3]), w - 8 - ind);
        ls.forEach((t, i) => { y = salto(doc, y, 6); if (!i) { doc.setFont('helvetica', 'bold'); doc.text(m[2], M + ind, y + 3); doc.setFont('helvetica', 'normal'); } doc.text(t, M + 7 + ind, y + 3); y += 4.2; });
        y += 0.6; continue;
      }
      doc.setFontSize(9); const ls = doc.splitTextToSize(limpio(l), w);
      ls.forEach((t) => { y = salto(doc, y, 6); doc.text(t, M, y + 3); y += 4.2; });
      y += 1;
    }
    volcarTabla();
    firmas(doc, y + 6, [firmaIBCOL(emp, firma, 'Elaboró'), { titulo: 'Aprobó', nombre: ent?.representante || 'Nombre:', lineas: ['Representante legal / coordinador de calidad'] }]);
    return pie(doc, emp);
  }
  const tablaFn = (d, y, head, body) => tabla(d, y, head, body, { fs: 8 });

  // ------------------------------------------------------------------ FIRMAR UN PDF EXISTENTE
  async function firmarPDF(blob, firmaDataURL, { pagina, xRel, yRel, nombre, detalle }) {
    const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
    const pdf = await PDFDocument.load(await blob.arrayBuffer(), { ignoreEncryption: true });
    const pags = pdf.getPages();
    const p = pags[Math.min(Math.max(0, pagina), pags.length - 1)];
    const { width, height } = p.getSize();
    const img = firmaDataURL.startsWith('data:image/png') ? await pdf.embedPng(firmaDataURL) : await pdf.embedJpg(firmaDataURL);
    const w = Math.min(150, width * 0.28), h = (img.height / img.width) * w;
    const x = Math.min(Math.max(0, xRel * width - w / 2), width - w);
    const yy = Math.min(Math.max(14, height - yRel * height - h / 2), height - h);
    p.drawImage(img, { x, y: yy, width: w, height: h });
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    p.drawText(nombre || '', { x, y: yy - 8, size: 7, font, color: rgb(0.15, 0.15, 0.15) });
    p.drawText(detalle || '', { x, y: yy - 16, size: 6, font, color: rgb(0.35, 0.35, 0.35) });
    return new Blob([await pdf.save()], { type: 'application/pdf' });
  }

  // ------------------------------------------------------------------ NÚMEROS EN LETRAS
  function enLetras(n) {
    n = Math.round(Number(n) || 0);
    if (n === 0) return 'cero';
    const U = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiún', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
    const D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const C = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    const cien = (x) => {
      if (x === 100) return 'cien';
      const c = Math.floor(x / 100), r = x % 100; let s = C[c];
      if (r) s += (s ? ' ' : '') + (r < 30 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? ' y ' + U[r % 10] : ''));
      return s;
    };
    const miles = (x) => { const m = Math.floor(x / 1000), r = x % 1000; return (m ? (m === 1 ? 'mil' : cien(m) + ' mil') : '') + (r ? (m ? ' ' : '') + cien(r) : ''); };
    const mill = Math.floor(n / 1e6), r = n % 1e6;
    let s = mill ? (mill === 1 ? 'un millón' : miles(mill) + ' millones') : '';
    if (r) s += (s ? ' ' : '') + miles(r); else if (mill) s += ' de';
    return s;
  }

  return { documento, hojaVida, inventario, cronograma, mantenimiento, alertas, evento, acta, cotizacion, cuentaCobro, indicadores, firmarPDF, enLetras, fF, pesos };
})();
