// =====================================================================
//  PROGRAMA DE TECNOVIGILANCIA · documentos PDF
//  FT-PGTV-016 (reporte voluntario), consolidado / reporte en cero
//  trimestral (RETEIM-002), documento del programa (PG-TV-001 adaptable
//  por entidad), presentación de capacitación, pre y post test (FMB-008),
//  lista de asistencia, plan semestral e indicadores (GT-IND-036).
// =====================================================================
(() => {
  const A = window.APP, st = A.st;
  const TV = (A.TV = A.TV || {});
  const AZ = [0, 150, 190], GR = [217, 217, 217], CL = [221, 243, 250], NG = [0, 0, 0];
  const nuevo = (o = 'p') => new window.jspdf.jsPDF({ unit: 'mm', format: 'letter', orientation: o });
  const img = (doc, src, x, y, mw, mh) => { if (!src) return; try { const p = doc.getImageProperties(src); const r = Math.min(mw / p.width, mh / p.height); doc.addImage(src, /^data:image\/png/i.test(src) ? 'PNG' : 'JPEG', x + (mw - p.width * r) / 2, y + (mh - p.height * r) / 2, p.width * r, p.height * r); } catch (e) { console.warn(e); } };
  const fF = (s) => (s ? UI.fecha(String(s).slice(0, 10)) : '');
  const dma = (s) => { if (!s) return ['', '', '']; const d = new Date(String(s).slice(0, 10) + 'T12:00:00'); return isNaN(d) ? ['', '', ''] : [String(d.getDate()).padStart(2, '0'), String(d.getMonth() + 1).padStart(2, '0'), String(d.getFullYear())]; };
  const X = (b) => (b ? 'X' : '');
  const sn = (t) => String(t ?? '').replace(/\u2264/g, '<=').replace(/\u2265/g, '>=');
  const fmtDe = (k) => st.fmt[k] || CAT.FORMATOS[k] || {};
  TV.fmtDe = fmtDe;

  // ------------------------------------------------------------------ encabezado / pie comunes (diseño de los formatos IBCOL de tecnovigilancia)
  // | LOGO DE LA ENTIDAD | TÍTULO + NOMBRE DE LA ENTIDAD | CÓDIGO · VERSIÓN · FECHA |
  TV.encabezado = (doc, { fmt, ent, titulo, pagina = null }) => {
    const W = doc.internal.pageSize.getWidth(), M = 12, ancho = W - 2 * M, y = 10, hh = 22, c1 = 40, c3 = 44, cw = ancho - c1 - c3;
    doc.setDrawColor(...NG); doc.setLineWidth(0.25); doc.setTextColor(...NG);
    doc.rect(M, y, ancho, hh); doc.line(M + c1, y, M + c1, y + hh); doc.line(M + c1 + cw, y, M + c1 + cw, y + hh); doc.line(M + c1, y + hh * 0.6, M + c1 + cw, y + hh * 0.6);
    if (ent?.logo) img(doc, ent.logo, M + 1.5, y + 1.5, c1 - 3, hh - 3); else { doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.text('LOGO DE LA ENTIDAD', M + c1 / 2, y + hh / 2 + 1, { align: 'center' }); }
    doc.setFont('helvetica', 'bold'); let fs = 10.5; const t = String(titulo || fmt.titulo || '').toUpperCase();
    let ls = doc.setFontSize(fs).splitTextToSize(t, cw - 4); while (ls.length > 2 && fs > 7) { fs -= 0.5; ls = doc.setFontSize(fs).splitTextToSize(t, cw - 4); }
    doc.text(ls, M + c1 + cw / 2, y + hh * 0.3 - (ls.length - 1) * fs * 0.18 + 1.2, { align: 'center' });
    doc.setFontSize(8.5); doc.text(doc.splitTextToSize((ent?.razon_social || 'NOMBRE DE LA ENTIDAD').toUpperCase(), cw - 4)[0], M + c1 + cw / 2, y + hh * 0.8 + 1, { align: 'center' });
    const rx = M + c1 + cw, cel = [`CÓDIGO: ${fmt.codigo || ''}`, `VERSIÓN: ${fmt.version || ''}`, `FECHA: ${fF(fmt.fecha)}`, pagina || ''].filter((x, i) => i < 3 || x);
    cel.forEach((c, i) => { const yy = y + (hh / cel.length) * i; if (i) doc.line(rx, yy, rx + c3, yy); doc.setFontSize(7.2); doc.text(c, rx + c3 / 2, yy + hh / cel.length / 2 + 1.2, { align: 'center' }); });
    return y + hh + 4;
  };
  TV.pie = (doc, fmt, { elaboro = true } = {}) => {
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 12, emp = st.emp || {}, n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); const fy = H - 20; doc.setTextColor(60); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.6);
      if (elaboro) { doc.setFont('helvetica', 'bolditalic'); doc.text('ELABORADO POR:', M, fy); doc.setFont('helvetica', 'italic'); doc.text(`Nombre: ${emp.responsable || ''}`, M, fy + 4); doc.text(`Cargo: ${emp.cargo || 'Ingeniera Biomédica'}`, M, fy + 8); }
      doc.setFont('helvetica', 'normal');
      [emp.nombre || 'IBCOL Ingeniería Biomédica de Colombia', `CONTACTOS: ${[emp.telefono, emp.telefono2].filter(Boolean).join(' – ')}`, `E-MAIL: ${emp.email || ''}`, `DIRECCIÓN: ${emp.direccion || ''}`, emp.ciudad || ''].forEach((l, k) => doc.text(l, W / 2, fy + k * 3, { align: 'center' }));
      img(doc, window.IBCOL_LOGO, W - M - 30, fy - 2, 30, 13);
      doc.setFontSize(6.2); doc.text(`${fmt.codigo || ''} · V${fmt.version || ''} · Página ${i} de ${n}`, W - M, H - 4, { align: 'right' }); doc.setTextColor(...NG);
    }
  };

  // ------------------------------------------------------------------ FT-PGTV-016 · reporte voluntario (mismo diseño del Excel)
  TV.pdf016 = (ent, ev, eq = null) => {
    const d = ev.datos || {}, fmt = fmtDe('evento'), doc = nuevo('p');
    const W = doc.internal.pageSize.getWidth(), M = 12, ancho = W - 2 * M, gap = 2, cw = (ancho - gap) / 2, rh = 4.4;
    let y0 = TV.encabezado(doc, { fmt, ent, titulo: 'Formato reporte voluntario de evento / incidente adverso con dispositivos médicos' });
    doc.setFontSize(6.6); doc.setFont('helvetica', 'normal'); doc.rect(M, y0 - 1, ancho, 4.5); doc.text('Reporte VOLUNTARIO de Evento o Incidente Adverso asociado al uso de un Dispositivo Médico por parte de Prestadores de Servicios de Salud, Fabricantes e Importadores', W / 2, y0 + 2, { align: 'center' });
    y0 += 5;
    // columna con filas de celdas: [{t, w, b, fill, c, x}]  (w en fracción del ancho de la columna)
    const col = (x0) => {
      let y = y0;
      const fila = (cels, alto0 = rh) => { let alto = alto0;
        let x = x0; doc.setDrawColor(...NG); doc.setLineWidth(0.15);
        cels.forEach((c) => { if (c.top || c.t === undefined || c.t === null || c.t === '') return; doc.setFont('helvetica', c.b ? 'bold' : 'normal'); const fs = c.fs || 5.8; doc.setFontSize(fs); const n = doc.splitTextToSize(String(c.t), cw * c.w - 1.6).length; alto = Math.max(alto, n * fs * 0.42 + 1.4); });
        cels.forEach((c) => {
          const w = cw * c.w; if (c.fill) { doc.setFillColor(...c.fill); doc.rect(x, y, w, alto, 'FD'); } else doc.rect(x, y, w, alto);
          if (c.t !== undefined && c.t !== null && c.t !== '') {
            doc.setFont('helvetica', c.b ? 'bold' : 'normal'); doc.setTextColor(...(c.az ? AZ : NG)); let fs = c.fs || 5.8; doc.setFontSize(fs);
            const ls = doc.splitTextToSize(String(c.t), w - 1.6); const max = Math.max(1, Math.floor((alto - 0.8) / (fs * 0.42)));
            const tx = ls.slice(0, max); const ty = c.top ? y + fs * 0.42 + 0.4 : y + alto / 2 - ((tx.length - 1) * fs * 0.42) / 2 + fs * 0.15;
            doc.text(tx, c.c ? x + w / 2 : x + 0.8, ty, { align: c.c ? 'center' : 'left' }); doc.setTextColor(...NG);
          }
          x += w;
        });
        y += alto;
      };
      const barra = (t) => fila([{ t, w: 1, b: true, fill: GR, c: true, az: true }]);
      return { fila, barra, get y() { return y; }, set y(v) { y = v; } };
    };
    const L = col(M), R = col(M + cw + gap);
    const lb = (t, w) => ({ t, w, b: true }), vl = (t, w) => ({ t: t || '', w });
    // ----- izquierda
    L.barra('LUGAR DE OCURRENCIA DEL EVENTO O INCIDENTE');
    L.fila([lb('NOMBRE DE LA INSTITUCIÓN', 0.32), vl(d.institucion || ent.razon_social, 0.68)]);
    L.fila([lb('SEDE', 0.32), vl(d.sede, 0.3), lb('NIT', 0.12), vl(d.nit || ent.nit, 0.26)]);
    L.fila([lb('DEPARTAMENTO', 0.32), vl(d.departamento, 0.3), lb('CIUDAD', 0.12), vl(d.ciudad || ent.ciudad, 0.26)]);
    L.barra('INFORMACIÓN DEL PACIENTE');
    L.fila([lb('NOMBRE', 0.2), vl(d.pac_nombre, 0.8)]);
    L.fila([lb('IDENTIFICACIÓN', 0.2), vl([d.pac_tipo_id, d.pac_id].filter(Boolean).join(' '), 0.42), lb('EDAD', 0.1), vl([d.pac_edad, d.pac_edad_en].filter(Boolean).join(' '), 0.28)]);
    L.fila([lb('ÁREA O SERVICIO', 0.2), vl(d.area || ev.servicio, 0.8)]);
    L.fila([lb('DIAGNÓSTICO INICIAL DEL PACIENTE', 0.42), vl('', 0.58)]);
    L.fila([vl(d.pac_diagnostico, 1)], rh * 3);
    L.barra('IDENTIFICACIÓN DEL DISPOSITIVO MÉDICO (DM)');
    L.fila([lb('NOMBRE GENÉRICO DEL DM', 0.32), vl(d.dm_generico || eq?.nombre, 0.68)]);
    L.fila([lb('NOMBRE COMERCIAL DEL DM', 0.32), vl(d.dm_comercial, 0.68)]);
    L.fila([lb('REGISTRO SANITARIO / PERMISO DE COMERCIALIZACIÓN', 0.58), vl(d.dm_rs || eq?.registro_sanitario, 0.42)]);
    L.fila([lb('REFERENCIA', 0.2), vl(d.dm_referencia, 0.4), lb('LOTE', 0.1), vl(d.dm_lote, 0.3)]);
    L.fila([lb('MODELO', 0.2), vl(d.dm_modelo || eq?.modelo, 0.4), lb('SERIE', 0.1), vl(d.dm_serie || eq?.serie, 0.3)]);
    L.fila([lb('FABRICANTE', 0.32), vl(d.dm_fabricante, 0.68)]);
    L.fila([lb('IMPORTADOR / DISTRIBUIDOR', 0.32), vl(d.dm_importador, 0.68)]);
    L.fila([lb('EL DISPOSITIVO MÉDICO HA SIDO UTILIZADO MÁS DE UNA VEZ', 0.62), { t: 'SI', w: 0.08, b: true, c: true, az: true }, { t: X(d.dm_mas_vez === 'SI'), w: 0.08, c: true, b: true }, { t: 'NO', w: 0.1, b: true, c: true, az: true }, { t: X(d.dm_mas_vez === 'NO'), w: 0.12, c: true, b: true }]);
    L.barra('EVENTO O INCIDENTE ADVERSO');
    const fe = dma(ev.fecha_evento), fr = dma(d.fecha_reporte);
    L.fila([lb('FECHA DEL EVENTO / INCIDENTE ADVERSO', 0.64), { t: fe[0] || 'DD', w: 0.1, c: true }, { t: fe[1] || 'MM', w: 0.1, c: true }, { t: fe[2] || 'AAAA', w: 0.16, c: true }]);
    L.fila([lb('FECHA DE ELABORACIÓN DEL REPORTE', 0.64), { t: fr[0] || 'DD', w: 0.1, c: true }, { t: fr[1] || 'MM', w: 0.1, c: true }, { t: fr[2] || 'AAAA', w: 0.16, c: true }]);
    const yd = L.y;
    ['ANTES DEL USO DEL DM', 'DURANTE EL USO DEL DM', 'DESPUÉS DEL USO DEL DM'].forEach((t, i) => { L.y = yd + i * rh; const x0 = M; void x0; L.fila([{ t: '', w: 0.5 }, { t, w: 0.36, b: true, az: true, c: true }, { t: X(d.deteccion === ['Antes', 'Durante', 'Después'][i]), w: 0.14, c: true, b: true }]); });
    doc.setFillColor(255, 255, 255); doc.rect(M, yd, cw * 0.5, rh * 3, 'FD'); doc.setFont('helvetica', 'bold'); doc.setFontSize(5.8); doc.text(['DETECCIÓN DEL EVENTO /', 'INCIDENTE ADVERSO'], M + cw * 0.25, yd + rh * 1.3, { align: 'center' });
    L.barra('INFORMACIÓN DEL REPORTANTE');
    L.fila([lb('NOMBRE', 0.32), vl(d.rep_nombre || ev.reportante, 0.68)]);
    L.fila([lb('PROFESIÓN', 0.32), vl(d.rep_profesion || ev.cargo, 0.68)]);
    L.fila([lb('DIRECCIÓN', 0.32), vl(d.rep_direccion, 0.68)]);
    L.fila([lb('TELÉFONO', 0.32), vl(d.rep_telefono, 0.68)]);
    L.fila([lb('CORREO INSTITUCIONAL', 0.32), vl(d.rep_correo, 0.68)]);
    const ya = L.y;
    L.fila([{ t: '', w: 0.76 }, { t: 'SI', w: 0.1, b: true, c: true, az: true }, { t: X(d.autoriza === 'SI'), w: 0.14, c: true, b: true }]);
    L.fila([{ t: '', w: 0.76 }, { t: 'NO', w: 0.1, b: true, c: true, az: true }, { t: X(d.autoriza === 'NO'), w: 0.14, c: true, b: true }]);
    doc.setFillColor(255, 255, 255); doc.rect(M, ya, cw * 0.76, rh * 2, 'FD'); doc.setFontSize(5.6); doc.text(doc.splitTextToSize('AUTORIZA AL FABRICANTE / IMPORTADOR / DISTRIBUIDOR LA DIVULGACIÓN DEL ORIGEN DEL REPORTE', cw * 0.74), M + 0.8, ya + 3);
    const fn = dma(d.fecha_notificacion);
    L.fila([lb('FECHA DE NOTIFICACIÓN', 0.4), { t: fn[0] || 'DD', w: 0.15, c: true }, { t: fn[1] || 'MM', w: 0.15, c: true }, { t: fn[2] || 'AAAA', w: 0.3, c: true }]);
    // ----- derecha
    const cl = ev.clasificacion || '';
    R.barra('CLASIFICACIÓN');
    R.fila([lb('EVENTO ADVERSO SERIO', 0.37), { t: X(cl === 'Evento adverso serio'), w: 0.13, c: true, b: true }, lb('INCIDENTE ADVERSO SERIO', 0.37), { t: X(cl === 'Incidente adverso serio'), w: 0.13, c: true, b: true }]);
    R.fila([lb('EVENTO ADVERSO NO SERIO', 0.37), { t: X(cl === 'Evento adverso no serio'), w: 0.13, c: true, b: true }, lb('INCIDENTE ADVERSO NO SERIO', 0.37), { t: X(cl === 'Incidente adverso no serio'), w: 0.13, c: true, b: true }]);
    R.barra('DESCRIPCIÓN DEL EVENTO O INCIDENTE ADVERSO');
    R.fila([{ t: ev.descripcion || '', w: 1, top: true, fs: 6.4 }], rh * 15);
    R.barra('DESENLACE DEL EVENTO O INCIDENTE ADVERSO');
    TV.DESENLACES.forEach((t) => R.fila([lb(t === 'Otro' ? `OTRO ¿CUÁL? ${d.desenlace === 'Otro' ? (d.desenlace_otro || '') : ''}` : t.toUpperCase(), 0.86), { t: X(d.desenlace === t), w: 0.14, c: true, b: true }]));
    R.barra('GESTIÓN REALIZADA');
    R.fila([{ t: `CAUSA PROBABLE DEL EVENTO / INCIDENTE\n${d.causa ? TV.causaTxt(d.causa) : ''}`, w: 1, top: true, b: false }], rh * 3);
    R.fila([{ t: `ACCIONES CORRECTIVAS Y PREVENTIVAS INICIADAS\n${d.acciones || ''}`, w: 1, top: true }], rh * 3.6);
    const sn = (lab, v, extra = null) => R.fila([lb(lab, 0.5), { t: 'SI', w: 0.08, b: true, c: true, az: true }, { t: X(v === 'SI'), w: 0.1, c: true, b: true }, { t: 'NO', w: 0.08, b: true, c: true, az: true }, { t: X(v === 'NO'), w: 0.24, c: true, b: true, ...(extra ? { t: `${X(v === 'NO')}` } : {}) }]);
    sn('REPORTÓ AL IMPORTADOR / DISTRIBUIDOR', d.reporto_fab); sn('DM DISPONIBLE PARA EVALUACIÓN', d.dm_disponible);
    const fe5 = dma(d.fecha_envio);
    R.fila([lb('DM ENVIADO AL IMPORTADOR / DISTRIBUIDOR', 0.5), { t: `SI ${X(d.dm_enviado === 'SI')}  NO ${X(d.dm_enviado === 'NO')}`, w: 0.18, c: true, b: true }, lb('FECHA', 0.1), { t: fe5.join('/').replace(/^\/\/$/, 'DD/MM/AAAA'), w: 0.22, c: true }]);
    TV.pie(doc, fmt);
    return doc;
  };

  // ------------------------------------------------------------------ consolidado trimestral RETEIM-002 / reporte en cero
  TV.pdfTrimestral = (ent, { anio, t, evs, reg }) => {
    const fmt = fmtDe('evento'), doc = nuevo(evs.length ? 'l' : 'p'), W = doc.internal.pageSize.getWidth(), M = 12;
    let y = TV.encabezado(doc, { fmt: { ...fmt, codigo: 'RETEIM-002', version: '002' }, ent, titulo: evs.length ? `Reporte trimestral de eventos e incidentes adversos no serios · RETEIM-002` : 'Reporte trimestral de tecnovigilancia en cero' });
    const per = `${TV.TRIM[t - 1]} de ${anio} (${TV.mesesTrim(t)})`;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    if (!evs.length) {
      y += 6;
      const txt = `${ent.razon_social || ''}${ent.nit ? `, identificada con NIT ${ent.nit}` : ''}, a través del referente de su Programa Institucional de Tecnovigilancia, certifica que durante el ${per} NO se presentaron ni se identificaron eventos ni incidentes adversos asociados al uso de dispositivos médicos en sus servicios, por lo cual se realiza el reporte trimestral EN CERO ante el INVIMA a través del aplicativo web de Tecnovigilancia, conforme a la Resolución 4816 de 2008.`;
      doc.text(doc.splitTextToSize(txt, W - 2 * M), M, y, { lineHeightFactor: 1.5, align: 'justify', maxWidth: W - 2 * M }); y += 34;
      doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M }, styles: { fontSize: 8.5, cellPadding: 1.6, lineColor: NG, lineWidth: 0.2, textColor: NG }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70, fillColor: CL } },
        body: [['Periodo reportado', per], ['Eventos / incidentes adversos no serios', '0 (cero)'], ['Eventos / incidentes adversos serios', String(reg?.serios ?? 0)], ['Fecha de reporte al INVIMA', fF(reg?.fecha_envio) || 'Pendiente'], ['Número de radicado / constancia', reg?.radicado || ''], ['Referente del programa', TV.cfg(ent).referente || ''], ['Observaciones', reg?.obs || '']] });
      y = doc.lastAutoTable.finalY + 22;
      doc.line(M, y, M + 70, y); doc.setFontSize(8); doc.text([TV.cfg(ent).referente || 'Referente del programa de tecnovigilancia', TV.cfg(ent).cargo || 'Referente de tecnovigilancia'], M, y + 4);
    } else {
      doc.text(`Periodo: ${per} · ${evs.length} evento(s) / incidente(s) adverso(s) no serio(s) · Fecha de reporte INVIMA: ${fF(reg?.fecha_envio) || 'pendiente'}${reg?.radicado ? ' · Radicado ' + reg.radicado : ''}`, M, y + 2);
      doc.autoTable({ startY: y + 5, theme: 'grid', margin: { left: M, right: M, bottom: 24 }, styles: { fontSize: 6.4, cellPadding: 0.9, lineColor: NG, lineWidth: 0.15, textColor: NG, valign: 'top' }, headStyles: { fillColor: CL, textColor: NG, fontStyle: 'bold' },
        head: [['#', 'Código', 'Fecha evento', 'Servicio', 'Dispositivo médico (RS · lote/serie)', 'Clasificación', 'Detección', 'Descripción', 'Desenlace', 'Causa (NTC 5736)', 'Acciones', 'Estado']],
        body: evs.map((ev, i) => { const d = ev.datos || {}; return [i + 1, d.codigo || '', fF(ev.fecha_evento), d.area || ev.servicio || '', [d.dm_generico, d.dm_rs, d.dm_lote || d.dm_serie].filter(Boolean).join(' · '), ev.clasificacion || '', d.deteccion || '', ev.descripcion || '', d.desenlace || '', TV.causaTxt(d.causa), d.acciones || '', TV.estadoTxt(d.estado_reporte)]; }),
        columnStyles: { 0: { cellWidth: 6 }, 7: { cellWidth: 55 }, 10: { cellWidth: 35 } } });
    }
    TV.pie(doc, fmt); return doc;
  };

  // ------------------------------------------------------------------ DOCUMENTO DEL PROGRAMA (PG-TV-001 adaptable)
  TV.pdfPrograma = async (ent, { texto, cfg, eqs }) => {
    const fmt = { ...fmtDe('programa_tv'), ...(cfg.codigo ? { codigo: cfg.codigo } : {}), ...(cfg.version ? { version: cfg.version } : {}), ...(cfg.fecha ? { fecha: cfg.fecha } : {}) };
    const doc = nuevo('p'), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 22, ancho = W - 2 * M, TOP = 40, BOT = 30;
    const vals = { ENTIDAD: ent.razon_social, REFERENTE: [cfg.referente, cfg.cargo ? `(${cfg.cargo})` : ''].filter(Boolean).join(' '), DELEGADO: [cfg.delegado, cfg.cargo_delegado ? `(${cfg.cargo_delegado})` : ''].filter(Boolean).join(' '), CODIGO_RNT: cfg.codigo_rnt, USUARIO_INVIMA: cfg.usuario_invima, CORREO_TV: cfg.correo, NIT: ent.nit, CIUDAD: ent.ciudad };
    const rep = (s) => String(s).replace(/\{([A-Z_]+)\}/g, (m, k) => (vals[k] ? vals[k] : `[${k.replace(/_/g, ' ')}]`));
    // portada
    doc.setFillColor(...AZ); doc.rect(0, 0, W, 8, 'F'); doc.rect(0, H - 8, W, 8, 'F');
    if (ent.logo) img(doc, ent.logo, W / 2 - 35, 40, 70, 40);
    doc.setTextColor(...AZ); doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.text(doc.splitTextToSize((fmt.titulo || 'PROGRAMA INSTITUCIONAL DE TECNOVIGILANCIA').toUpperCase(), ancho), W / 2, 105, { align: 'center' });
    doc.setTextColor(...NG); doc.setFontSize(15); doc.text(doc.splitTextToSize((ent.razon_social || '').toUpperCase(), ancho), W / 2, 135, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.text([`${fmt.codigo || ''} · Versión ${fmt.version || ''}`, `${ent.ciudad || ''}${ent.ciudad ? ' · ' : ''}${new Date((cfg.fecha || UI.hoy()) + 'T12:00:00').getFullYear()}`], W / 2, 155, { align: 'center' });
    img(doc, window.IBCOL_LOGO, W / 2 - 22, H - 52, 44, 20); doc.setFontSize(8); doc.text('Elaborado con el acompañamiento de IBCOL Ingeniería Biomédica de Colombia', W / 2, H - 26, { align: 'center' });
    // contenido (se llena al final)
    doc.addPage(); const pagTOC = doc.getNumberOfPages(); doc.addPage();
    let y = TOP; const toc = [];
    const salto = (n) => { if (y + n > H - BOT) { doc.addPage(); y = TOP; } };
    const escribir = (t, { fs = 10, b = false, ind = 0, vin = '', gapA = 1.8 } = {}) => {
      doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.setFontSize(fs); doc.setTextColor(...NG);
      const ls = doc.splitTextToSize(t, ancho - ind - (vin ? 5 : 0)); const lh = fs * 0.43;
      ls.forEach((ln, i) => { salto(lh + 1); if (vin && !i) doc.text(vin, M + ind, y); if (b) doc.text(ln, M + ind + (vin ? 5 : 0), y); else window.PDFJ(doc, ln, M + ind + (vin ? 5 : 0), y, ancho - ind - (vin ? 5 : 0), i === ls.length - 1); y += lh; });
      y += gapA;
    };
    let n1 = 0;
    const lineas = rep(texto).split('\n');
    for (const raw of lineas) {
      const l = raw.trimEnd(); if (!l.trim()) continue;
      if (l.startsWith('# ')) { n1++; const sig = lineas.slice(lineas.indexOf(raw) + 1).find((z) => z.trim()); salto(sig && sig.trim() === '[[FLUJO]]' ? 175 : 18); if (y > TOP + 2) y += 3; doc.setFillColor(...CL); doc.rect(M, y - 4.6, ancho, 7, 'F'); toc.push([`${n1}. ${l.slice(2).trim()}`, doc.getNumberOfPages(), 1]); escribir(`${n1}. ${l.slice(2).trim().toUpperCase()}`, { fs: 11.5, b: true, gapA: 3 }); continue; }
      if (l.startsWith('## ')) { salto(12); y += 1; toc.push([l.slice(3).trim(), doc.getNumberOfPages(), 2]); escribir(l.slice(3).trim(), { fs: 10.2, b: true, gapA: 1.5 }); continue; }
      if (l.startsWith('-- ')) { escribir(l.slice(3), { ind: 10, vin: '–', fs: 9.6 }); continue; }
      if (l.startsWith('- ')) { escribir(l.slice(2), { ind: 4, vin: '•', fs: 9.8 }); continue; }
      const tok = l.trim();
      if (tok === '[[FLUJO]]') { TV.flujo(doc, () => y, (v) => { y = v; }, salto, M, ancho); continue; }
      if (tok === '[[FICHAS]]') { for (const fi of TV.fichas(cfg)) { salto(50); doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M, top: TOP, bottom: BOT }, styles: { fontSize: 8.5, cellPadding: 1.4, lineColor: NG, lineWidth: 0.2, textColor: NG }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 48, fillColor: CL } }, body: fi }); y = doc.lastAutoTable.finalY + 6; } continue; }
      if (tok === '[[DISPOSITIVOS]]' && cfg.dispositivos?.clases?.length) {
        // cuadro igual al formato "Dispositivos médicos objeto de vigilancia" (Excel cargado para la entidad / sede)
        salto(30); const dv = cfg.dispositivos, body = [];
        dv.clases.forEach((c) => {
          const filas = c.filas.length ? c.filas : [['', '', '', '']];
          body.push([{ content: `RIESGO CLASE ${c.clase}`, rowSpan: filas.length + 1, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: CL } }, ...['DISPOSITIVO BIOMÉDICO', 'CODIFICACIÓN EVENTO ADVERSO', 'DISPOSITIVO BIOMÉDICO', 'CODIFICACIÓN EVENTO ADVERSO'].map((t) => ({ content: t, styles: { fontStyle: 'bold', halign: 'center', fillColor: CL } }))]);
          filas.forEach((f) => body.push(f.map((x, i) => ({ content: x || '', styles: { halign: i % 2 ? 'center' : 'left' } }))));
        });
        doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M, top: TOP, bottom: BOT }, styles: { fontSize: 7.2, cellPadding: 1, lineColor: NG, lineWidth: 0.2, textColor: NG, valign: 'middle' },
          head: [[{ content: rep(dv.titulo || 'DISPOSITIVOS MÉDICOS OBJETO DE VIGILANCIA EN {ENTIDAD}').toUpperCase(), colSpan: 5, styles: { halign: 'center', fillColor: GR, textColor: AZ, fontStyle: 'bold', fontSize: 8.5 } }]], body,
          columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: (ancho - 20) * 0.2 }, 2: { cellWidth: (ancho - 20) * 0.3 }, 3: { cellWidth: (ancho - 20) * 0.2 }, 4: { cellWidth: (ancho - 20) * 0.3 } } });
        y = doc.lastAutoTable.finalY + 4; doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.text('Codificación según la NTC 5736:2009 (tipos de eventos adversos y sus causas).', M, y); y += 6; continue;
      }
      if (tok === '[[DISPOSITIVOS]]') {
        const act = (eqs || []).filter((e) => e.estado !== 'Dado de baja'); const g = {};
        act.forEach((e) => { const k = `${(e.nombre || '').trim().toUpperCase()}|${e.clase_riesgo || ''}`; g[k] = (g[k] || 0) + 1; });
        const body = Object.entries(g).sort((a, b) => a[0].localeCompare(b[0], 'es')).map(([k, n]) => { const [nm, r] = k.split('|'); return [nm, r ? `Clase ${r}` : 'Sin clasificar', n]; });
        salto(20); doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M, top: TOP, bottom: BOT }, styles: { fontSize: 8, cellPadding: 1.1, lineColor: NG, lineWidth: 0.2, textColor: NG }, headStyles: { fillColor: CL, textColor: NG, fontStyle: 'bold' },
          head: [['Equipo biomédico / dispositivo médico', 'Clasificación de riesgo', 'Cantidad']], body: body.length ? body : [['Kardex de dispositivos médicos y equipos del inventario FMB-001', '', '']], columnStyles: { 1: { cellWidth: 40, halign: 'center' }, 2: { cellWidth: 22, halign: 'center' } } });
        y = doc.lastAutoTable.finalY + 6; continue;
      }
      if (tok === '[[CAMBIOS]]') {
        const filas = (cfg.cambios && cfg.cambios.length ? cfg.cambios : [{ version: fmt.version || '001', fecha: fmt.fecha, desc: 'Creación del documento', resp: `${st.emp.responsable || ''} - ${st.emp.cargo || 'Ingeniera Biomédica'}` }]);
        salto(24); doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M, top: TOP, bottom: BOT }, styles: { fontSize: 8.5, cellPadding: 1.3, lineColor: NG, lineWidth: 0.2, textColor: NG, halign: 'center' }, headStyles: { fillColor: CL, textColor: NG, fontStyle: 'bold' },
          head: [['Versión', 'Fecha', 'Descripción de la modificación', 'Nombre y cargo del responsable']], body: filas.map((c) => [c.version || '', fF(c.fecha), c.desc || '', c.resp || '']) });
        y = doc.lastAutoTable.finalY + 10;
        // firmas
        salto(40); const bw = (ancho - 8) / 3; ['ELABORÓ', 'REVISÓ', 'APROBÓ'].forEach((t, i) => { const x = M + i * (bw + 4); const p = [cfg.elaboro || `${st.emp.responsable || ''}|${st.emp.cargo || 'Ingeniera Biomédica'}`, cfg.reviso || `${cfg.referente || ''}|${cfg.cargo || 'Referente de tecnovigilancia'}`, cfg.aprobo || '|Representante legal'][i].split('|');
          doc.rect(x, y, bw, 30); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(t, x + bw / 2, y + 4.5, { align: 'center' }); if (i === 0 && st.firma) img(doc, st.firma, x + 4, y + 7, bw - 8, 11);
          doc.line(x + 4, y + 20, x + bw - 4, y + 20); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.text(doc.splitTextToSize(p[0] || '', bw - 4), x + bw / 2, y + 23.5, { align: 'center' }); doc.text(doc.splitTextToSize(p[1] || '', bw - 4)[0] || '', x + bw / 2, y + 27, { align: 'center' }); });
        y += 34; continue;
      }
      // párrafo (los pasos "1. … 2. …" quedan en líneas separadas)
      tok.split(/\s(?=\d{1,2}\.\s+[A-ZÁÉÍÓÚÑ])/).forEach((p) => { const m = p.match(/^(\d{1,2}\.)\s+(.*)$/); if (m) escribir(m[2], { ind: 4, vin: m[1], fs: 9.8 }); else escribir(p, { fs: 9.8 }); });
    }
    // contenido
    doc.setPage(pagTOC); y = TOP; doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...AZ); doc.text('CONTENIDO', W / 2, y, { align: 'center' }); doc.setTextColor(...NG); y += 9;
    const tot = doc.getNumberOfPages();
    toc.filter((x) => x[2] === 1 || toc.length < 60).forEach(([t, p, lv]) => { if (y > H - BOT) return; doc.setFont('helvetica', lv === 1 ? 'bold' : 'normal'); doc.setFontSize(lv === 1 ? 9.5 : 8.6); const x0 = M + (lv === 1 ? 0 : 6); const tt = doc.splitTextToSize(t, ancho - 20)[0]; doc.text(tt, x0, y); const tw = doc.getTextWidth(tt); doc.setTextColor(150); let dots = ''; while (doc.getTextWidth(dots + '.') < ancho - (x0 - M) - tw - 10) dots += '.'; doc.text(dots, x0 + tw + 1, y); doc.setTextColor(...NG); doc.text(String(p), W - M, y, { align: 'right' }); y += lv === 1 ? 5.6 : 4.6; });
    // encabezado y pie de cada página (menos la portada)
    for (let i = 2; i <= tot; i++) {
      doc.setPage(i); TV.encabezado(doc, { fmt, ent, titulo: fmt.titulo, pagina: `PÁGINA ${i} DE ${tot}` });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.6); doc.setTextColor(90);
      const emp = st.emp || {}; doc.text(`${emp.nombre || 'IBCOL Ingeniería Biomédica de Colombia'} · ${emp.email || ''} · ${[emp.telefono, emp.telefono2].filter(Boolean).join(' – ')}`, W / 2, H - 12, { align: 'center' });
      doc.text('Documento controlado. Su copia impresa o descargada se considera no controlada.', W / 2, H - 9, { align: 'center' }); doc.setTextColor(...NG);
    }
    return doc;
  };

  // flujograma del reporte de eventos / incidentes adversos
  TV.flujo = (doc, gy, sy, salto, M, ancho) => {
    salto(160); let y = gy(); const cx = M + ancho / 2, bw = 78, bh = 11;
    const caja = (t, x, yy, w = bw, fill = CL) => { doc.setFillColor(...fill); doc.setDrawColor(...AZ); doc.roundedRect(x - w / 2, yy, w, bh, 2, 2, 'FD'); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.6); doc.setTextColor(...NG); const ls = doc.splitTextToSize(t, w - 4); doc.text(ls, x, yy + bh / 2 - (ls.length - 1) * 1.5 + 1, { align: 'center' }); };
    const fl = (x1, y1, x2, y2) => { doc.setDrawColor(...AZ); doc.setLineWidth(0.4); doc.line(x1, y1, x2, y2); const a = Math.atan2(y2 - y1, x2 - x1); doc.setFillColor(...AZ); doc.triangle(x2, y2, x2 - 2.2 * Math.cos(a - 0.45), y2 - 2.2 * Math.sin(a - 0.45), x2 - 2.2 * Math.cos(a + 0.45), y2 - 2.2 * Math.sin(a + 0.45), 'F'); doc.setLineWidth(0.25); };
    const pasos = ['Ocurre o se detecta un evento / incidente adverso con un dispositivo médico', 'Atender al paciente y tomar medidas inmediatas (contingencia)', 'Retirar, rotular y conservar el dispositivo médico (no desechar)', 'Diligenciar el formato FT-PGTV-016 y entregarlo al delegado / referente'];
    caja('INICIO', cx, y, 30, [0, 176, 240]); doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.text('INICIO', cx, y + bh / 2 + 1, { align: 'center' }); doc.setTextColor(...NG);
    pasos.forEach((p) => { fl(cx, y + bh, cx, y + bh + 5); y += bh + 5; caja(p, cx, y); });
    fl(cx, y + bh, cx, y + bh + 5); y += bh + 5;
    // decisión
    const dh = 16, dw = 60; doc.setFillColor(255, 242, 204); doc.setDrawColor(...AZ); doc.lines([[dw / 2, dh / 2], [-dw / 2, dh / 2], [-dw / 2, -dh / 2], [dw / 2, -dh / 2]], cx, y, [1, 1], 'FD', true);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.6); doc.text(['¿Es SERIO? (muerte o', 'deterioro serio de la salud)'], cx, y + dh / 2 - 0.6, { align: 'center' });
    const xl = cx - 50, xr = cx + 50, yb = y + dh + 6;
    fl(cx - dw / 2, y + dh / 2, xl, y + dh / 2); fl(xl, y + dh / 2, xl, yb); fl(cx + dw / 2, y + dh / 2, xr, y + dh / 2); fl(xr, y + dh / 2, xr, yb);
    doc.setFontSize(7.5); doc.text('SÍ', cx - dw / 2 - 6, y + dh / 2 - 1.5); doc.text('NO', cx + dw / 2 + 3, y + dh / 2 - 1.5);
    caja('Reporte inmediato al INVIMA en el aplicativo web dentro de las 72 horas', xl, yb, 62, [253, 226, 226]);
    caja('Consolidar en el reporte trimestral RETEIM-002 (o reporte en cero si no hubo casos)', xr, yb, 62);
    y = yb + bh; fl(xl, y, xl, y + 6); fl(xr, y, xr, y + 6); doc.setDrawColor(...AZ); doc.line(xl, y + 6, xr, y + 6); fl(cx, y + 6, cx, y + 11); y += 11;
    ['Informar al fabricante / importador y análisis en el comité de tecnovigilancia (Protocolo de Londres, NTC 5736)', 'Plan de acción, seguimiento, retroalimentación al reportante y cierre del caso'].forEach((p, i) => { if (i) { fl(cx, y + bh, cx, y + bh + 5); y += bh + 5; } caja(p, cx, y, 100); });
    fl(cx, y + bh, cx, y + bh + 5); y += bh + 5; caja('FIN', cx, y, 30, [0, 176, 240]); doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.text('FIN', cx, y + bh / 2 + 1, { align: 'center' }); doc.setTextColor(...NG);
    sy(y + bh + 8);
  };
  TV.fichas = (cfg) => {
    const metaEv = cfg.meta_eventos || '3%';
    return [
      [['Nombre del indicador', 'Porcentaje (%) cumplimiento de actividades programadas de mantenimiento preventivo.'], ['Objetivo del indicador', 'Cumplir con el 100% de actividades de mantenimiento preventivo de la institución.'], ['Fórmula de cálculo', '(AMPR / AMPP) × 100\nAMPR: actividades de mantenimiento preventivo realizadas.\nAMPP: actividades de mantenimiento preventivo programadas.'], ['Unidad de medición', 'Porcentaje.'], ['Periodicidad', 'Trimestral / semestral.'], ['Meta prevista', '100% ejecutado al final del año (>= 95% por periodo).'], ['Fuente de información', 'Cronograma de mantenimiento preventivo y reportes de mantenimiento del gestor.']],
      [['Nombre del indicador', 'Porcentaje (%) adherencia al programa de tecnovigilancia.'], ['Objetivo del indicador', 'Verificar la adherencia al programa de tecnovigilancia mediante la ejecución del plan de capacitación.'], ['Fórmula de cálculo', '(NCR / NCP) × 100\nNCR: número de capacitaciones realizadas.\nNCP: número de capacitaciones programadas.'], ['Unidad de medición', 'Porcentaje.'], ['Periodicidad', 'Semestral.'], ['Meta prevista', '95% en cada periodo medido.'], ['Fuente de información', 'Plan de capacitación semestral, listas de asistencia y post test.']],
      [['Nombre del indicador', 'Porcentaje (%) índice de ocurrencia de eventos o incidentes adversos.'], ['Objetivo del indicador', 'Verificar el índice de ocurrencia de eventos o incidentes adversos asociados a dispositivos médicos.'], ['Fórmula de cálculo', '(NEAD / NTPA) × 100\nNEAD: número de eventos o incidentes adversos con DM detectados.\nNTPA: número total de pacientes atendidos en el periodo.'], ['Unidad de medición', 'Porcentaje.'], ['Periodicidad', 'Trimestral.'], ['Meta prevista', `<= ${metaEv} de manera trimestral.`], ['Fuente de información', 'Reportes FT-PGTV-016, consolidado RETEIM-002 y estadística de pacientes atendidos.']],
      [['Nombre del indicador', 'Oportunidad del reporte de eventos e incidentes adversos serios.'], ['Objetivo del indicador', 'Garantizar que todo evento o incidente adverso serio se notifique al INVIMA dentro de las 72 horas.'], ['Fórmula de cálculo', '(Serios reportados en <= 72 h / total de serios) × 100'], ['Unidad de medición', 'Porcentaje.'], ['Periodicidad', 'Trimestral.'], ['Meta prevista', '100%.'], ['Fuente de información', 'Reportes FT-PGTV-016 y constancias del aplicativo web del INVIMA.']],
      [['Nombre del indicador', 'Eficacia de la capacitación (resultado del post test).'], ['Objetivo del indicador', 'Evaluar el conocimiento adquirido por el personal capacitado.'], ['Fórmula de cálculo', 'Promedio de calificación del post test (%)'], ['Unidad de medición', 'Porcentaje.'], ['Periodicidad', 'Semestral.'], ['Meta prevista', '>= 80%.'], ['Fuente de información', 'Formato pre y post test FMB-008.']],
    ];
  };

  // ------------------------------------------------------------------ PRESENTACIÓN DE LA CAPACITACIÓN (diapositivas en PDF)
  TV.pdfPresentacion = (ent, { ses = null, casosEnt = [], casos = null } = {}) => {
    const CAS = casos && casos.length ? casos : TV.CASOS;
    const doc = nuevo('l'), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), cfg = TV.cfg(ent);
    const fondo = (t, sub = '') => {
      doc.setFillColor(255, 255, 255); doc.rect(0, 0, W, H, 'F'); doc.setFillColor(...AZ); doc.rect(0, 0, W, 24, 'F'); doc.setFillColor(0, 176, 240); doc.rect(0, 24, W, 1.6, 'F');
      doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(19); doc.text(t, 14, 15.5); if (sub) { doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.text(sub, W - 14, 15.5, { align: 'right' }); }
      doc.setTextColor(...NG); img(doc, window.IBCOL_LOGO, W - 40, H - 16, 28, 12); if (ent.logo) img(doc, ent.logo, 12, H - 16, 28, 12);
      doc.setFontSize(7.5); doc.setTextColor(120); doc.text(`Programa de tecnovigilancia · ${ent.razon_social || ''}`, W / 2, H - 7, { align: 'center' }); doc.setTextColor(...NG);
    };
    const vin = (items, x = 18, y = 40, w = W - 36, fs = 15) => { items.forEach((t) => { const sub = t.startsWith('  '); doc.setFont('helvetica', 'normal'); doc.setFontSize(sub ? fs - 1.5 : fs); const ls = doc.splitTextToSize(t.trim(), w - (sub ? 14 : 8)); doc.setTextColor(...(sub ? [70, 70, 70] : NG)); doc.setFillColor(...AZ); if (!sub) doc.circle(x + 1.5, y - 1.4, 1.2, 'F'); else doc.text('–', x + 7, y); doc.text(ls, x + (sub ? 11 : 6), y, { align: 'justify', maxWidth: w - (sub ? 14 : 8) }); y += ls.length * fs * 0.45 + (sub ? 2 : 3.2); }); doc.setTextColor(...NG); return y; };
    const diapo = (t, items, sub) => { doc.addPage(); fondo(t, sub); vin(items); };
    const caso = (n, c) => {
      doc.addPage(); fondo(`Caso ${n}: ${c.titulo}`, c.tipo);
      const col = /no serio/i.test(c.tipo) ? [255, 242, 204] : [253, 226, 226];
      doc.setFillColor(...col); doc.roundedRect(14, 32, W - 28, 12, 2, 2, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text(`Clasificación: ${c.tipo.toUpperCase()}`, W / 2, 40, { align: 'center' });
      const half = (W - 40) / 2;
      doc.setFontSize(12); doc.setTextColor(...AZ); doc.text('¿Qué pasó?', 18, 54); doc.text('¿Qué se debe hacer?', 26 + half, 54); doc.setTextColor(...NG);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(13); doc.text(doc.splitTextToSize(c.que, half - 4), 18, 62, { align: 'justify', maxWidth: half - 4 });
      vin(c.hacer, 24 + half, 62, half, 13);
      if (c.leccion) { doc.setFillColor(...CL); doc.roundedRect(14, H - 50, W - 28, 22, 2, 2, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.text('Lección aprendida / barrera:', 18, H - 42); doc.setFont('helvetica', 'normal'); doc.text(doc.splitTextToSize(c.leccion, W - 40), 18, H - 36, { align: 'justify', maxWidth: W - 40 }); }
    };
    // 1 portada
    doc.setFillColor(...AZ); doc.rect(0, 0, W, H, 'F'); doc.setFillColor(255, 255, 255); doc.roundedRect(18, 40, W - 36, H - 80, 4, 4, 'F');
    if (ent.logo) img(doc, ent.logo, 28, 50, 50, 28); img(doc, window.IBCOL_LOGO, W - 80, 50, 50, 24);
    doc.setTextColor(...AZ); doc.setFont('helvetica', 'bold'); doc.setFontSize(28); doc.text('PROGRAMA DE TECNOVIGILANCIA', W / 2, 100, { align: 'center' });
    doc.setTextColor(...NG); doc.setFontSize(15); doc.text(doc.splitTextToSize(ses?.datos?.tema || 'Capacitación al personal asistencial y administrativo', W - 60), W / 2, 114, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.text([`${ent.razon_social || ''}`, `${ses ? `${ses.periodo === 'S2' ? 'Segundo' : 'Primer'} semestre ${ses.anio} · ${UI.fecha(ses.fecha)}` : `${new Date().getFullYear()}`}`, `${ses?.datos?.capacitador || st.emp.responsable || ''}`], W / 2, 134, { align: 'center' });
    diapo('Objetivos de la capacitación', ['Reconocer qué es la tecnovigilancia y por qué es obligatoria en la institución.', 'Diferenciar evento adverso e incidente adverso, serio y no serio, con casos reales.', 'Aprender a reportar: formato FT-PGTV-016, tiempos (72 horas y trimestral) y a quién entregarlo.', 'Conocer las alertas sanitarias (INVIMA / RISARH) y su gestión.', 'Fortalecer la cultura del reporte: no punitiva, confidencial y orientada a aprender.']);
    diapo('¿Qué es la tecnovigilancia?', ['Conjunto de actividades que tienen por objeto la identificación y la cualificación de efectos adversos serios e indeseados producidos por los dispositivos médicos, así como la identificación de los factores de riesgo asociados, con base en la notificación, registro y evaluación sistemática.', 'Marco normativo:', '  Resolución 4816 de 2008: reglamenta el Programa Nacional de Tecnovigilancia.', '  Decreto 4725 de 2005: registros sanitarios y vigilancia de dispositivos médicos.', '  Resolución 3100 de 2019: condiciones de habilitación (estándar de dotación y procesos prioritarios).', '  NTC 5736:2009: codificación de tipos de eventos adversos y sus causas.']);
    const dvx = cfg.dispositivos?.clases?.filter((c) => c.filas.some((f) => f[0] || f[2]));
    if (dvx?.length) { const nom = { I: 'bajo riesgo', IIA: 'riesgo moderado', IIB: 'riesgo alto', III: 'muy alto riesgo' }; diapo('Dispositivos objeto de vigilancia en la institución', [...dvx.map((c) => { const l = c.filas.flatMap((f) => [f[0], f[2]]).filter(Boolean).map((x) => x.trim().toLowerCase()); return `Clase ${c.clase} (${nom[c.clase] || ''}): ${l.slice(0, 12).join(', ')}${l.length > 12 ? ` y ${l.length - 12} más` : ''}.`; }), 'A mayor riesgo, mayor control: mantenimiento, metrología, capacitación y vigilancia.'], 'Clasificación de riesgo'); }
    else diapo('Dispositivos médicos y clasificación de riesgo', ['Clase I (bajo riesgo): bajalenguas, vendajes, tensiómetros manuales, fonendoscopios.', 'Clase IIa (riesgo moderado): termómetros digitales, glucómetros, agujas, sondas de corta duración.', 'Clase IIb (riesgo alto): bombas de infusión, monitores de signos vitales, incubadoras, electrobisturí.', 'Clase III (muy alto riesgo): desfibriladores implantables, válvulas cardiacas, catéteres en sistema circulatorio central.', 'A mayor riesgo, mayor control: mantenimiento, metrología, capacitación y vigilancia.']);
    doc.addPage(); fondo('Evento o incidente · serio o no serio');
    const cw = (W - 42) / 2, ch = 62, qx = [16, 26 + cw], qy = [34, 102];
    [['EVENTO ADVERSO SERIO', 'Daño no intencionado que llevó a la muerte o al deterioro serio de la salud del paciente, operador o de quien lo rodea.', [253, 226, 226], 'Reporte al INVIMA dentro de 72 horas'], ['INCIDENTE ADVERSO SERIO', 'Potencial riesgo de daño que PUDO haber llevado a la muerte o al deterioro serio, pero por causalidad o una barrera no se generó.', [253, 226, 226], 'Reporte al INVIMA dentro de 72 horas'],
      ['EVENTO ADVERSO NO SERIO', 'Daño no intencionado diferente a los que llevan a la muerte o al deterioro serio de la salud.', [255, 242, 204], 'Reporte trimestral (RETEIM-002)'], ['INCIDENTE ADVERSO NO SERIO', 'Potencial riesgo de daño diferente a los que pudieron llevar a la muerte o al deterioro serio de la salud.', [255, 242, 204], 'Reporte trimestral (RETEIM-002)']].forEach(([t, d, c, r], i) => {
      const x = qx[i % 2], yy = qy[Math.floor(i / 2)]; doc.setFillColor(...c); doc.roundedRect(x, yy, cw, ch, 3, 3, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text(t, x + cw / 2, yy + 10, { align: 'center' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.text(doc.splitTextToSize(d, cw - 12), x + 6, yy + 20, { align: 'justify', maxWidth: cw - 12 }); doc.setFont('helvetica', 'bold'); doc.setTextColor(...AZ); doc.text(r, x + cw / 2, yy + ch - 6, { align: 'center' }); doc.setTextColor(...NG); });
    diapo('¿Qué se considera deterioro serio de la salud?', ['Enfermedad o daño que amenace la vida.', 'Daño de una función o estructura corporal.', 'Condición que requiera una intervención médica o quirúrgica para prevenir un daño permanente.', 'Evento que lleve a una incapacidad permanente parcial.', 'Evento que necesite hospitalización o prolongación de la hospitalización.', 'Evento que sea el origen de una malformación congénita.']);
    CAS.forEach((c, i) => caso(i + 1, c));
    casosEnt.slice(0, 4).forEach((ev, i) => caso(CAS.length + i + 1, { titulo: `caso de la institución (${UI.fecha(ev.fecha_evento)})`, tipo: ev.clasificacion || 'Evento / incidente adverso', que: `${ev.datos?.dm_generico ? ev.datos.dm_generico + ': ' : ''}${ev.descripcion || ''}`.slice(0, 600), hacer: [ev.datos?.acciones || ev.contingencia || 'Acciones registradas en el reporte FT-PGTV-016.'], leccion: ev.datos?.causa ? `Causa probable (NTC 5736): ${TV.causaTxt(ev.datos.causa)}` : '' }));
    doc.addPage(); fondo('¿Cómo reportar? Paso a paso');
    const pasos = ['1. Atienda al paciente y tome las medidas de contingencia.', '2. Retire el dispositivo, rotúlelo "NO USAR" y consérvelo con su empaque, lote y registro sanitario.', '3. Diligencie el formato FT-PGTV-016 (datos del paciente, DM, evento, gestión y reportante).', `4. Entréguelo al delegado${cfg.delegado ? ` (${cfg.delegado})` : ''} o al referente${cfg.referente ? ` (${cfg.referente})` : ''} de tecnovigilancia.`, '5. SERIO: el referente lo reporta al INVIMA dentro de las 72 horas en el aplicativo web.', '6. NO SERIO: se consolida y se reporta trimestralmente (RETEIM-002). Sin casos: reporte en cero.', '7. El comité analiza el caso, define el plan de acción y retroalimenta al reportante.'];
    let yy = 38; pasos.forEach((p, i) => { doc.setFillColor(...(i === 4 ? [253, 226, 226] : i === 5 ? [255, 242, 204] : CL)); doc.roundedRect(16, yy - 6, W - 32, 15, 2, 2, 'F'); doc.setFont('helvetica', i > 3 && i < 6 ? 'bold' : 'normal'); doc.setFontSize(12.5); doc.text(doc.splitTextToSize(p, W - 44), 22, yy + 2); yy += 18.5; });
    diapo('El formato FT-PGTV-016', ['Lugar de ocurrencia: institución, sede, NIT, departamento y ciudad.', 'Paciente: nombre, identificación, edad, área o servicio y diagnóstico.', 'Dispositivo médico: nombre genérico y comercial, registro sanitario, lote, modelo, serie, fabricante e importador.', 'Evento: fecha del evento y del reporte, detección (antes, durante o después del uso), descripción y desenlace.', 'Gestión: causa probable, acciones correctivas y preventivas, reporte al importador y disponibilidad del DM.', 'Reportante: nombre, profesión y contacto. La información es confidencial.']);
    diapo('Alertas sanitarias y RISARH', ['Cada mes se consultan las alertas, retiros de producto (recall) e informes de seguridad del INVIMA (app.invima.gov.co/alertas) y de agencias internacionales.', 'Se verifica si el dispositivo, marca, modelo o lote está en la institución (inventario FMB-001 y kardex).', 'Si aplica: retirar o aislar el producto, informar al proveedor, socializar con el personal y registrar en la bitácora FT-PGTV-015.', 'Las alertas consultadas se analizan en el comité de tecnovigilancia.']);
    diapo('Análisis del caso: Protocolo de Londres', ['Identificar las acciones inseguras y los factores contributivos:', '  Paciente · Dispositivo médico · Operador (conocimiento, experiencia)', '  Tarea y tecnología · Equipo de trabajo · Ambiente (temperatura, humedad, energía) · Organización', 'Codificar la causa probable según la NTC 5736 (ej. 540 Calibración, 730 Mantenimiento, 910 Entrenamiento, 950 Error de uso).', 'Definir plan de acción con responsables y fechas, hacer seguimiento y cerrar el caso.']);
    diapo('¿Por qué reportar? Cultura del reporte', ['Reportar NO es buscar culpables: el reporte es voluntario, confidencial y no punitivo (Resolución 4816 de 2008).', 'Cada reporte permite corregir fallas antes de que lleguen al paciente y alimenta las alertas nacionales.', 'Un trimestre "en cero" no siempre es bueno: puede significar que no estamos detectando.', 'Los incidentes (casi-eventos) son los reportes más valiosos: muestran barreras que funcionaron.']);
    diapo('Estrategias para incentivar el reporte', ['Reconocimiento trimestral al servicio y a la persona que más reporta y aporta mejoras (certificado / mención en comité).', 'Retroalimentación al reportante en máximo 8 días: qué se hizo con su reporte.', 'Reporte fácil: formato físico en cada servicio y formato digital; el delegado apoya el diligenciamiento.', 'Confidencialidad garantizada: el nombre del reportante y del paciente no se divulga.', 'Socializar las lecciones aprendidas en el comité y en las capacitaciones semestrales.', 'Incluir la tecnovigilancia en la inducción y reinducción del personal; metas de reporte por servicio.']);
    diapo('Para recordar', ['Serio = 72 horas al INVIMA. No serio = trimestral. Sin casos = reporte en cero.', 'Nunca deseche el dispositivo involucrado: es la evidencia para el análisis.', 'Use el formato FT-PGTV-016 y entréguelo al delegado / referente.', `Referente: ${cfg.referente || '[REFERENTE]'}${cfg.cargo ? ` – ${cfg.cargo}` : ''}.  Delegado: ${cfg.delegado || '[DELEGADO]'}.`, 'Gracias por cuidar la seguridad del paciente.']);
    diapo('Evaluación', ['Responda el post test (formato FMB-008) para evaluar lo aprendido.', 'Firme la lista de asistencia.', 'Meta institucional: calificación del post test >= 80%.']);
    return doc;
  };

  // ------------------------------------------------------------------ PRE / POST TEST (FMB-008)
  TV.pdfTest = (ent, { ses, preguntas, t = null, fase = 'pre' }) => {
    const fmt = fmtDe('test_tv'), doc = nuevo('p'), W = doc.internal.pageSize.getWidth(), M = 14, H = doc.internal.pageSize.getHeight();
    let y = TV.encabezado(doc, { fmt, ent, titulo: fmt.titulo });
    const f = t?.fase || fase;
    doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M }, styles: { fontSize: 8.5, cellPadding: 1.4, lineColor: NG, lineWidth: 0.2, textColor: NG }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 36, fillColor: CL }, 2: { fontStyle: 'bold', cellWidth: 26, fillColor: CL } },
      body: [['FECHA', t ? fF(t.fecha) : (ses?.fecha ? fF(ses.fecha) : ''), 'TIPO', `PRE-TEST ${f === 'pre' ? '( X )' : '(   )'}    POST-TEST ${f === 'post' ? '( X )' : '(   )'}`], ['NOMBRE', t?.datos?.nombre || '', 'CÉDULA', t?.datos?.cedula || ''], ['SERVICIO', t?.datos?.servicio || '', 'CARGO', t?.datos?.cargo || ''], ['TEMA DE CAPACITACIÓN', { content: ses?.datos?.tema || '', colSpan: 3 }]] });
    y = doc.lastAutoTable.finalY + 6; doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('Marque con una X la o las respuestas correctas.', M, y); y += 6;
    const resp = t?.datos?.resp || [];
    preguntas.forEach((q, i) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); const ls = doc.splitTextToSize(`${i + 1}. ${q.p}`, W - 2 * M); if (y + ls.length * 4 + q.o.length * 4.6 > H - 28) { doc.addPage(); y = TV.encabezado(doc, { fmt, ent, titulo: fmt.titulo }); }
      doc.text(ls, M, y); y += ls.length * 4 + 1; doc.setFont('helvetica', 'normal');
      q.o.forEach((o, j) => { const sel = (resp[i] || []).includes(j); doc.rect(M + 4, y - 3, 3.2, 3.2); if (sel) { doc.setFont('helvetica', 'bold'); doc.text('X', M + 4.6, y - 0.3); doc.setFont('helvetica', 'normal'); } const ol = doc.splitTextToSize(`${'abcdefg'[j]}) ${o}`, W - 2 * M - 12); doc.text(ol, M + 10, y); y += ol.length * 4 + 0.6; });
      y += 2.5;
    });
    if (t) { y += 2; doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setFillColor(...CL); doc.rect(M, y - 4.5, W - 2 * M, 8, 'F'); doc.text(`RESULTADO: ${t.datos.correctas} de ${preguntas.length} respuestas correctas · ${t.datos.puntaje}%`, W / 2, y + 0.8, { align: 'center' }); y += 10; if (t.datos.firma) { img(doc, t.datos.firma, M, y, 45, 14); doc.line(M, y + 15, M + 50, y + 15); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.text('Firma del participante', M, y + 18.5); } }
    TV.pie(doc, fmt); return doc;
  };
  // hoja de respuestas (solo para el capacitador)
  TV.pdfClave = (ent, { ses, preguntas }) => {
    const fmt = fmtDe('test_tv'), doc = nuevo('p'), M = 14; let y = TV.encabezado(doc, { fmt, ent, titulo: `${fmt.titulo} · CLAVE DE RESPUESTAS` });
    doc.autoTable({ startY: y + 2, theme: 'grid', margin: { left: M, right: M }, styles: { fontSize: 8.5, cellPadding: 1.4, lineColor: NG, lineWidth: 0.2, textColor: NG }, headStyles: { fillColor: CL, textColor: NG }, head: [['#', 'Pregunta', 'Respuesta(s) correcta(s)']], body: preguntas.map((q, i) => [i + 1, q.p, q.c.map((j) => `${'abcdefg'[j]}) ${q.o[j]}`).join('\n')]), columnStyles: { 0: { cellWidth: 8 } } });
    doc.setFontSize(8); doc.text(`Tema: ${ses?.datos?.tema || ''}`, M, doc.lastAutoTable.finalY + 6); TV.pie(doc, fmt); return doc;
  };

  // ------------------------------------------------------------------ LISTA DE ASISTENCIA (codificación editable)
  TV.pdfAsistencia = async (ent, { ses, asistentes, tests = [] }) => {
    const fmt = fmtDe('asistencia_tv'), doc = nuevo('l'), M = 12; const d = ses.datos || {};
    let y = TV.encabezado(doc, { fmt, ent, titulo: fmt.titulo });
    doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M }, styles: { fontSize: 8, cellPadding: 1.1, lineColor: NG, lineWidth: 0.2, textColor: NG }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 34, fillColor: CL }, 2: { fontStyle: 'bold', cellWidth: 30, fillColor: CL } },
      body: [['TEMA', { content: d.tema || '', colSpan: 3 }], ['FECHA', fF(d.fecha_ejec || ses.fecha), 'HORA', [d.hora_ini, d.hora_fin].filter(Boolean).join(' a ')], ['CAPACITADOR', d.capacitador || st.emp.responsable || '', 'LUGAR / MODALIDAD', [d.lugar, d.modalidad].filter(Boolean).join(' · ')], ['DIRIGIDO A', d.dirigido || '', 'INTENSIDAD', d.duracion || '']] });
    y = doc.lastAutoTable.finalY + 3;
    const nota = (c, f) => { const t = tests.find((x) => x.datos.fase === f && x.datos.cedula && x.datos.cedula === c); return t ? `${t.datos.puntaje}%` : ''; };
    const filas = (asistentes.length ? asistentes : Array.from({ length: 15 }, () => ({})));
    const body = filas.map((a, i) => [i + 1, a.nombre || '', a.cedula || '', a.cargo || '', a.servicio || '', nota(a.cedula, 'pre'), nota(a.cedula, 'post'), '']);
    doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M, bottom: 26 }, styles: { fontSize: 8, cellPadding: 1, lineColor: NG, lineWidth: 0.2, textColor: NG, minCellHeight: 9, valign: 'middle' }, headStyles: { fillColor: CL, textColor: NG, fontStyle: 'bold', halign: 'center' },
      head: [['No.', 'NOMBRES Y APELLIDOS', 'CÉDULA', 'CARGO', 'SERVICIO', 'PRE', 'POST', 'FIRMA']], body,
      columnStyles: { 0: { cellWidth: 9, halign: 'center' }, 2: { cellWidth: 28 }, 5: { cellWidth: 14, halign: 'center' }, 6: { cellWidth: 14, halign: 'center' }, 7: { cellWidth: 46 } },
      didDrawCell: (c) => { if (c.section === 'body' && c.column.index === 7) { const fr = filas[c.row.index]?.firma; if (fr) img(doc, fr, c.cell.x + 1, c.cell.y + 0.5, c.cell.width - 2, c.cell.height - 1); } } });
    TV.pie(doc, fmt); return doc;
  };

  // ------------------------------------------------------------------ PLAN DE CAPACITACIÓN SEMESTRAL
  TV.pdfPlan = (ent, { anio, sesiones }) => {
    const fmt = fmtDe('plan_cap_tv'), doc = nuevo('l'), M = 12; let y = TV.encabezado(doc, { fmt, ent, titulo: `${fmt.titulo} · ${anio}` });
    ['S1', 'S2'].forEach((p) => {
      const l = sesiones.filter((s) => s.periodo === p); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...AZ); doc.text(p === 'S1' ? `PRIMER SEMESTRE ${anio} (enero – junio)` : `SEGUNDO SEMESTRE ${anio} (julio – diciembre)`, M, y + 3); doc.setTextColor(...NG);
      doc.autoTable({ startY: y + 5, theme: 'grid', margin: { left: M, right: M, bottom: 26 }, styles: { fontSize: 7.6, cellPadding: 1.1, lineColor: NG, lineWidth: 0.2, textColor: NG, valign: 'middle' }, headStyles: { fillColor: CL, textColor: NG, fontStyle: 'bold', halign: 'center' },
        head: [['#', 'Tema', 'Objetivo / contenido', 'Dirigido a', 'Capacitador', 'Fecha programada', 'Estado', 'Fecha ejecución', 'Asist.', 'Pre', 'Post']],
        body: (l.length ? l : [{ datos: {} }]).map((s, i) => { const d = s.datos || {}; return [l.length ? i + 1 : '', d.tema || '', d.objetivo || '', d.dirigido || '', d.capacitador || '', fF(s.fecha), d.estado || '', fF(d.fecha_ejec), (d.asistentes || []).filter((a) => a.nombre).length || '', s._pre ?? '', s._post ?? '']; }),
        columnStyles: { 0: { cellWidth: 7 }, 1: { cellWidth: 46 }, 2: { cellWidth: 66 }, 5: { cellWidth: 20 }, 7: { cellWidth: 20 }, 8: { cellWidth: 11 }, 9: { cellWidth: 11 }, 10: { cellWidth: 11 } } });
      y = doc.lastAutoTable.finalY + 6;
    });
    const tot = sesiones.length, ej = sesiones.filter((s) => s.datos?.estado === 'Ejecutada').length;
    doc.setFontSize(8.5); doc.text(`Adherencia al plan (NCR / NCP × 100): ${ej} / ${tot} = ${tot ? Math.round((ej / tot) * 100) : 0}%  ·  Meta 95%`, M, y + 2);
    TV.pie(doc, fmt); return doc;
  };

  // ------------------------------------------------------------------ INDICADORES (GT-IND-036)
  TV.pdfIndicadores = (ent, { anio, filas, analisis = {} }) => {
    const fmt = fmtDe('indicadores_tv'), doc = nuevo('l'), M = 12; let y = TV.encabezado(doc, { fmt, ent, titulo: `${fmt.titulo} · ${anio}` });
    doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M, bottom: 26 }, styles: { fontSize: 7.6, cellPadding: 1.2, lineColor: NG, lineWidth: 0.2, textColor: NG, valign: 'middle', halign: 'center' }, headStyles: { fillColor: CL, textColor: NG, fontStyle: 'bold' },
      head: [['Indicador', 'Fórmula', 'Meta', 'I trim.', 'II trim.', 'III trim.', 'IV trim.', 'Año']],
      body: filas.map((f) => [{ content: sn(f.nombre), styles: { halign: 'left', fontStyle: 'bold' } }, { content: sn(f.formula), styles: { halign: 'left' } }, sn(f.meta), ...f.v.map((x) => sn(x.txt)), sn(f.anual.txt)]),
      columnStyles: { 0: { cellWidth: 58 }, 1: { cellWidth: 70 } },
      didParseCell: (c) => { if (c.section === 'body' && c.column.index >= 3) { const f = filas[c.row.index]; const v = c.column.index === 7 ? f.anual : f.v[c.column.index - 3]; if (v && v.ok !== null && v.ok !== undefined) c.cell.styles.fillColor = v.ok ? [220, 245, 225] : [253, 226, 226]; } } });
    y = doc.lastAutoTable.finalY + 6;
    const an = ['T1', 'T2', 'T3', 'T4'].filter((t) => analisis[t]).map((t, i) => [TV.TRIM[+t[1] - 1], analisis[t]]); void 0;
    if (an.length) doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M, bottom: 26 }, styles: { fontSize: 8, cellPadding: 1.4, lineColor: NG, lineWidth: 0.2, textColor: NG }, headStyles: { fillColor: CL, textColor: NG }, head: [['Periodo', 'Análisis del resultado y acciones de mejora']], body: an, columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } } });
    TV.pie(doc, fmt); return doc;
  };
})();
