// =====================================================================
//  CAPACITACIONES EN EQUIPOS BIOMÉDICOS (programa de capacitación PCEC-019)
//  Cronograma por equipo, presentación (PDF), pre y post test (en pantalla o
//  por enlace virtual, mismo sistema del programa de tecnovigilancia), lista
//  de asistencia y acta de capacitación con resultados y evidencia
//  fotográfica.
//  Registros en tv_registros: tipo 'sesion' con datos.programa = 'equipos'
//  (los test quedan como tipo 'test' con datos.sesion_id).
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st, P = A.PROT, TV = A.TV;
  const { h, I, toast, modal, confirmar, leer, f } = UI;
  const esProp = A.esProp, TB = 'tv_registros';
  const AZ = [0, 150, 190], CL = [221, 243, 250], NG = [0, 0, 0];
  const anioAct = new Date().getFullYear();
  const fF = (s) => (s ? UI.fecha(String(s).slice(0, 10)) : '');
  const slug = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);
  const sn = (t) => String(t ?? '').replace(/−/g, '-').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/[✓✔]/g, '-').replace(/µ/g, 'u');
  const nuevo = (o) => new window.jspdf.jsPDF({ unit: 'mm', format: 'letter', orientation: o });
  const img = (doc, src, x, y, mw, mh) => { if (!src) return; try { const p = doc.getImageProperties(src); const r = Math.min(mw / p.width, mh / p.height); doc.addImage(src, /^data:image\/png/i.test(src) ? 'PNG' : 'JPEG', x + (mw - p.width * r) / 2, y + (mh - p.height * r) / 2, p.width * r, p.height * r); } catch (e) { /* */ } };

  // formatos (código / versión editables en Administración → Formatos)
  Object.assign(CAT.FORMATOS, {
    cronograma_cap_eq: CAT.FORMATOS.cronograma_cap_eq || { titulo: 'CRONOGRAMA DE CAPACITACIÓN CONTINUA EN EQUIPOS BIOMÉDICOS', codigo: 'FT-CCC-012', version: '01', fecha: '2022-09-01' },
    acta_cap_eq: CAT.FORMATOS.acta_cap_eq || { titulo: 'ACTA DE CAPACITACIÓN EN EQUIPOS BIOMÉDICOS', codigo: 'FMB-010', version: '01', fecha: '2026-11-13' },
  });
  const fmtDe = (k) => st.fmt?.[k] || CAT.FORMATOS[k] || {};

  // contenido del equipo de una sesión
  P.capDe = (d) => (d?.equipo_k && d.equipo_k !== 'otro' ? P.CAP_EQ.find((x) => x.k === d.equipo_k) : null) || P.capGenerico(d?.equipo || 'equipo biomédico');
  const eqsDeTipo = (ctx, cap, nombre) => ctx.eqs.filter((e) => (cap.re ? cap.re.test(e.nombre || '') : String(e.nombre || '').toUpperCase().trim() === String(nombre || '').toUpperCase().trim()));

  // ------------------------------------------------------------------ PRESENTACIÓN
  P.pdfPresEquipo = (ent, ses, ctx) => {
    const d = ses?.datos || {}, cap = P.capDe(d), nom = d.equipo || cap.n;
    const doc = nuevo('l'), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    const fondo = (t, sub = '') => {
      doc.setFillColor(255, 255, 255); doc.rect(0, 0, W, H, 'F'); doc.setFillColor(...AZ); doc.rect(0, 0, W, 24, 'F'); doc.setFillColor(0, 176, 240); doc.rect(0, 24, W, 1.6, 'F');
      doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(19); doc.text(sn(t), 14, 15.5); if (sub) { doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.text(sn(sub), W - 14, 15.5, { align: 'right' }); }
      doc.setTextColor(...NG); img(doc, window.IBCOL_LOGO, W - 40, H - 16, 28, 12); if (ent.logo) img(doc, ent.logo, 12, H - 16, 28, 12);
      doc.setFontSize(7.5); doc.setTextColor(120); doc.text(sn(`Capacitación en equipos biomédicos · ${nom} · ${ent.razon_social || ''}`), W / 2, H - 7, { align: 'center' }); doc.setTextColor(...NG);
    };
    const vin = (items, y = 40) => { items.forEach((t) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(15); const ls = doc.splitTextToSize(sn(t), W - 44); doc.setFillColor(...AZ); doc.circle(19.5, y - 1.4, 1.2, 'F'); doc.text(ls, 26, y); y += ls.length * 6.6 + 4; }); return y; };
    const diapo = (t, items) => { doc.addPage(); fondo(t, nom); vin(items); };
    // portada
    doc.setFillColor(...AZ); doc.rect(0, 0, W, H, 'F'); doc.setFillColor(255, 255, 255); doc.roundedRect(18, 34, W - 36, H - 68, 4, 4, 'F');
    if (ent.logo) img(doc, ent.logo, 28, 42, 50, 28); img(doc, window.IBCOL_LOGO, W - 80, 42, 50, 24);
    doc.setTextColor(...AZ); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text('CAPACITACIÓN EN USO SEGURO DE EQUIPOS BIOMÉDICOS', W / 2, 86, { align: 'center' });
    doc.setFontSize(30); doc.text(sn(nom.toUpperCase()), W / 2, 102, { align: 'center' });
    doc.setTextColor(...NG); doc.setFontSize(12); doc.setFont('helvetica', 'normal');
    doc.text([cap.clase || d.clase ? `Clasificación de riesgo: Clase ${d.clase || cap.clase}` : '', ent.razon_social || '', `${ses ? fF(d.fecha_ejec || ses.fecha) : new Date().getFullYear()}${d.capacitador || st.emp?.responsable ? ' · ' + (d.capacitador || st.emp.responsable) : ''}`].filter(Boolean).map(sn), W / 2, 118, { align: 'center' });
    diapo('Objetivo de la capacitación', [d.objetivo || cap.objetivo, `Dirigido a: ${d.dirigido || cap.dirigido}.`, 'Al final se evalúa lo aprendido con el post test (meta >= 80 %).']);
    cap.diapos.forEach(([t, items]) => diapo(t, items));
    // equipos de la institución
    const eqs = ctx ? eqsDeTipo(ctx, cap, nom) : [];
    if (eqs.length) {
      doc.addPage(); fondo('Equipos de la institución', nom);
      doc.autoTable({ startY: 34, theme: 'grid', margin: { left: 16, right: 16, bottom: 22 }, styles: { fontSize: 10, cellPadding: 1.6, lineColor: NG, lineWidth: 0.2, textColor: NG, halign: 'left' }, headStyles: { fillColor: CL, textColor: NG, fontStyle: 'bold', halign: 'center' },
        head: [['Código', 'Equipo', 'Marca', 'Modelo', 'Serie', 'Ubicación', 'Mantenimiento', 'Metrología']],
        body: eqs.slice(0, 14).map((e) => [e.codigo_inv || '', e.nombre || '', e.marca || '', e.modelo || '', e.serie || '', [ctx.consM[e.consultorio_id]?.sede, ctx.consM[e.consultorio_id]?.nombre].filter(Boolean).join(' / '), e.periodicidad_mto || '', e.periodicidad_metro || ''].map(sn)) });
    }
    if (ctx) { const L = P.limpiezaDe(ctx, String(nom).toUpperCase()); if (!cap.diapos.some(([t]) => /limpieza/i.test(t))) diapo('Limpieza y desinfección', [L.proc, `Producto: ${L.agente}.`, `Frecuencia: ${L.frec}.`, 'Registre la limpieza en el formato FMB-006.']); }
    diapo('Reporte de fallas y tecnovigilancia', ['Ante cualquier falla: retire el equipo, rotúlelo «fuera de servicio» y repórtelo a ingeniería biomédica (gestor biomédico, WhatsApp o teléfono).', 'Si la falla afectó o pudo afectar a un paciente u operador, diligencie el formato FT-PGTV-016 (evento o incidente adverso).', 'Conserve el equipo y sus accesorios para el análisis; no intente repararlo.']);
    diapo('Evaluación', ['Responda el post test (formato FMB-008) desde el enlace o en papel.', 'Firme la lista de asistencia.', 'Meta institucional: calificación del post test >= 80 %.', '¡Gracias!']);
    return doc;
  };

  // ------------------------------------------------------------------ CRONOGRAMA
  P.pdfCronoEquipos = (ent, anio, ses) => {
    const fmt = fmtDe('cronograma_cap_eq'), doc = nuevo('l'), M = 12; let y = TV.encabezado(doc, { fmt, ent, titulo: `${fmt.titulo} · ${anio}` });
    const ms = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M, bottom: 26 }, styles: { fontSize: 7.4, cellPadding: 1.1, lineColor: NG, lineWidth: 0.2, textColor: NG, valign: 'middle', halign: 'left' }, headStyles: { fillColor: CL, textColor: NG, fontStyle: 'bold', halign: 'center' },
      head: [['#', 'Equipo', 'Clase', 'Tema', 'Dirigido a', 'Capacitador', ...ms, 'Estado']],
      body: (ses.length ? ses : [{ datos: {} }]).map((s, i) => { const d = s.datos || {}, m = s.fecha ? +String(s.fecha).slice(5, 7) : 0, ok = d.estado === 'Ejecutada'; return [ses.length ? i + 1 : '', d.equipo || '', d.clase || '', d.tema || '', d.dirigido || '', d.capacitador || '', ...ms.map((_, j) => ({ content: j + 1 === m ? (ok ? 'E' : 'P') : '', styles: { halign: 'center', fontStyle: 'bold', fillColor: j + 1 === m ? (ok ? [220, 245, 225] : CL) : [255, 255, 255] } })), d.estado || ''].map((c) => (typeof c === 'string' ? sn(c) : c)); }),
      columnStyles: { 0: { cellWidth: 7 }, 1: { cellWidth: 30 }, 2: { cellWidth: 11, halign: 'center' }, 3: { cellWidth: 52 }, 4: { cellWidth: 34 }, 5: { cellWidth: 28 }, 18: { cellWidth: 20 } } });
    y = doc.lastAutoTable.finalY + 5; const ej = ses.filter((s) => s.datos?.estado === 'Ejecutada').length;
    doc.setFontSize(8.5); doc.text(sn(`P = programada · E = ejecutada.  Cumplimiento del cronograma: ${ej} / ${ses.length} = ${ses.length ? Math.round((ej / ses.length) * 100) : 0} %  ·  Meta >= 80 %`), M, y);
    TV.pie(doc, fmt); return doc;
  };

  // ------------------------------------------------------------------ ACTA DE CAPACITACIÓN
  P.pdfActaCap = async (ent, ses, tests, ctx) => {
    const d = ses.datos || {}, cap = P.capDe(d), fmt = fmtDe('acta_cap_eq'), doc = nuevo('p'), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 16, ancho = W - 2 * M;
    let y = TV.encabezado(doc, { fmt, ent, titulo: fmt.titulo }) + 2;
    const salto = (n) => { if (y + n > H - 28) { doc.addPage(); y = TV.encabezado(doc, { fmt, ent, titulo: fmt.titulo }) + 2; } };
    const tit = (t) => { salto(16); doc.setFillColor(...CL); doc.rect(M, y - 4.4, ancho, 6.5, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(sn(t), M + 2, y); y += 6; };
    const par = (t) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.4); const ls = doc.splitTextToSize(sn(t), ancho); ls.forEach((l, i) => { salto(5); if (window.PDFJ) window.PDFJ(doc, l, M, y, ancho, i === ls.length - 1); else doc.text(l, M, y); y += 4.2; }); y += 2; };
    const tabla = (o) => { doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M, top: 40, bottom: 28 }, styles: { fontSize: 8.4, cellPadding: 1.3, lineColor: NG, lineWidth: 0.2, textColor: NG, halign: 'left', valign: 'middle' }, headStyles: { fillColor: CL, textColor: NG, fontStyle: 'bold', halign: 'center' }, ...o }); y = doc.lastAutoTable.finalY + 5; };
    tit('1. DATOS GENERALES');
    tabla({ columnStyles: { 0: { fontStyle: 'bold', cellWidth: 34, fillColor: CL }, 2: { fontStyle: 'bold', cellWidth: 28, fillColor: CL } },
      body: [['ENTIDAD', { content: sn(ent.razon_social || ''), colSpan: 3 }], ['TEMA', { content: sn(d.tema || ''), colSpan: 3 }], ['EQUIPO', sn(d.equipo || cap.n), 'CLASE DE RIESGO', d.clase || cap.clase || ''], ['FECHA', fF(d.fecha_ejec || ses.fecha), 'HORA', [d.hora_ini, d.hora_fin].filter(Boolean).join(' a ')], ['LUGAR', sn(d.lugar || ''), 'MODALIDAD', sn(d.modalidad || 'Presencial')], ['CAPACITADOR', sn(d.capacitador || st.emp?.responsable || ''), 'INTENSIDAD', sn(d.duracion || '')], ['DIRIGIDO A', { content: sn(d.dirigido || cap.dirigido || ''), colSpan: 3 }]] });
    tit('2. OBJETIVO'); par(d.objetivo || cap.objetivo);
    tit('3. CONTENIDO DESARROLLADO');
    const cont = (d.acta?.contenido || cap.diapos.map(([t]) => t).join('\n')).split('\n').map((x) => x.trim()).filter(Boolean);
    cont.forEach((t, i) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.4); const ls = doc.splitTextToSize(sn(t.replace(/^[-•]\s*/, '')), ancho - 8); salto(ls.length * 4.2 + 1); doc.text(`${i + 1}.`, M + 1, y); doc.text(ls, M + 7, y); y += ls.length * 4.2 + 1; }); y += 2;
    // asistentes y resultados
    const pre = tests.filter((t) => t.datos.fase === 'pre'), post = tests.filter((t) => t.datos.fase === 'post');
    const nota = (a, l) => l.find((t) => (a.cedula && t.datos.cedula === a.cedula) || String(t.datos.nombre || '').toLowerCase() === String(a.nombre || '').toLowerCase());
    const asis = [...(d.asistentes || []).filter((a) => a.nombre)]; tests.forEach((t) => { if (!asis.some((a) => (a.cedula && a.cedula === t.datos.cedula) || a.nombre.toLowerCase() === String(t.datos.nombre).toLowerCase())) asis.push({ nombre: t.datos.nombre, cedula: t.datos.cedula, cargo: t.datos.cargo, servicio: t.datos.servicio, firma: t.datos.firma }); });
    tit(`4. ASISTENTES Y RESULTADOS DEL PRE Y POST TEST (${asis.length})`);
    tabla({ head: [['No.', 'Nombres y apellidos', 'Cédula', 'Cargo / servicio', 'Pre', 'Post', 'Mejora']], body: (asis.length ? asis : [{}]).map((a, i) => { const p1 = nota(a, pre), p2 = nota(a, post); const m = p1 && p2 ? p2.datos.puntaje - p1.datos.puntaje : null; return [asis.length ? i + 1 : '', sn(a.nombre || 'Sin asistentes registrados'), a.cedula || '', sn([a.cargo, a.servicio].filter(Boolean).join(' / ')), p1 ? p1.datos.puntaje + ' %' : '', p2 ? p2.datos.puntaje + ' %' : '', m === null ? '' : (m > 0 ? '+' : '') + m]; }),
      columnStyles: { 0: { cellWidth: 9, halign: 'center' }, 2: { cellWidth: 24 }, 4: { cellWidth: 14, halign: 'center' }, 5: { cellWidth: 14, halign: 'center' }, 6: { cellWidth: 15, halign: 'center' } } });
    // consolidado
    const pr = TV.prom(pre), po = TV.prom(post), apr = post.filter((t) => t.datos.puntaje >= 80).length;
    tit('5. CONSOLIDADO DE RESULTADOS');
    tabla({ columnStyles: { 0: { fontStyle: 'bold', fillColor: CL, cellWidth: 70 } }, body: [['Participantes', String(asis.length)], ['Pre test presentados / promedio', pre.length ? `${pre.length} · ${pr} %` : 'No se aplicó'], ['Post test presentados / promedio', post.length ? `${post.length} · ${po} %` : 'No se aplicó'], ['Aprobaron el post test (>= 80 %)', post.length ? `${apr} de ${post.length} (${Math.round((apr / post.length) * 100)} %)` : '—'], ['Mejora del promedio (post - pre)', pr !== null && po !== null ? `${po - pr > 0 ? '+' : ''}${po - pr} puntos` : '—']] });
    if (pr !== null || po !== null) { // gráfica pre vs post
      salto(48); const gx = M + 10, gy = y + 36, gh = 32, bw = 26; doc.setDrawColor(150); doc.line(gx, gy, gx + 110, gy); doc.line(gx, gy, gx, gy - gh - 2); doc.setFontSize(7); doc.setTextColor(110); [0, 50, 100].forEach((v) => { doc.text(`${v}`, gx - 2, gy - (v / 100) * gh + 1, { align: 'right' }); }); doc.setTextColor(...NG);
      [['Pre test', pr, [160, 200, 220]], ['Post test', po, AZ]].forEach(([t, v, c], i) => { if (v === null) return; const x = gx + 14 + i * 46, hh = (v / 100) * gh; doc.setFillColor(...c); doc.rect(x, gy - hh, bw, hh, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text(`${v} %`, x + bw / 2, gy - hh - 1.5, { align: 'center' }); doc.setFont('helvetica', 'normal'); doc.text(t, x + bw / 2, gy + 4.5, { align: 'center' }); });
      doc.setDrawColor(200, 60, 60); doc.setLineDashPattern([1.2, 1], 0); doc.line(gx, gy - 0.8 * gh, gx + 110, gy - 0.8 * gh); doc.setLineDashPattern([], 0); doc.setFontSize(7); doc.setTextColor(200, 60, 60); doc.text('Meta 80 %', gx + 111, gy - 0.8 * gh + 1); doc.setTextColor(...NG); doc.setDrawColor(...NG);
      y = gy + 10;
    }
    tit('6. CONCLUSIONES'); par(d.acta?.conclusiones || (po === null ? 'Se realizó la capacitación según lo programado.' : po >= 80 ? `El grupo alcanzó la meta institucional en el post test (promedio ${po} %), con una mejora frente al pre test${pr !== null ? ` (${pr} %)` : ''}. El personal demuestra conocimiento del uso seguro, la limpieza y los cuidados del equipo.` : `El promedio del post test (${po} %) no alcanzó la meta del 80 %. Se programa refuerzo de la capacitación para el personal que no aprobó.`));
    tit('7. COMPROMISOS'); (d.acta?.compromisos || 'Aplicar las recomendaciones de uso seguro, limpieza y cuidados del equipo.\nReportar oportunamente las fallas a ingeniería biomédica y los eventos o incidentes adversos al programa de tecnovigilancia.\nSocializar la guía rápida del equipo con el personal que no asistió.').split('\n').filter((x) => x.trim()).forEach((t) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.4); const ls = doc.splitTextToSize(sn(t.replace(/^[-•]\s*/, '')), ancho - 8); salto(ls.length * 4.2 + 1); doc.text('•', M + 2, y); doc.text(ls, M + 7, y); y += ls.length * 4.2 + 1; });
    y += 2;
    // evidencia fotográfica
    const fotos = d.fotos || [];
    if (fotos.length) {
      tit('8. EVIDENCIA FOTOGRÁFICA'); const fw = (ancho - 6) / 2, fh = 62;
      for (let i = 0; i < fotos.length; i++) {
        if (i % 2 === 0) salto(fh + 8);
        const x = M + (i % 2) * (fw + 6);
        try { const b = await S.fileBlob(fotos[i].archivo); const src = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); doc.setDrawColor(200); doc.rect(x, y, fw, fh); img(doc, src, x + 1, y + 1, fw - 2, fh - 2); doc.setDrawColor(...NG); } catch (e) { doc.rect(x, y, fw, fh); doc.setFontSize(8); doc.text('Foto no disponible', x + fw / 2, y + fh / 2, { align: 'center' }); }
        if (i % 2 === 1 || i === fotos.length - 1) y += fh + 6;
      }
    }
    // firmas
    salto(36); y += 4; const bw = (ancho - 10) / 2;
    [[sn(d.capacitador || st.emp?.responsable || ''), 'Capacitador(a) · ' + sn(st.emp?.cargo || 'Ingeniería biomédica'), st.firma], [sn(d.acta?.recibe || ''), sn(d.acta?.cargo_recibe || `Responsable · ${ent.razon_social || ''}`), d.acta?.firma_recibe]].forEach(([n, c, fi], i) => {
      const x = M + i * (bw + 10); if (fi) img(doc, fi, x + 10, y, bw - 20, 16); doc.line(x, y + 18, x + bw, y + 18); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.6); doc.text(n || ' ', x + bw / 2, y + 22, { align: 'center' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(doc.splitTextToSize(c, bw)[0], x + bw / 2, y + 26, { align: 'center' }); });
    TV.pie(doc, fmt, { elaboro: false }); return doc;
  };

  // ------------------------------------------------------------------ fotos: reducir y subir
  const reducir = (file) => new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { const k = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.78); }; im.onerror = () => rej(new Error('Imagen no válida')); im.src = u; });

  // ------------------------------------------------------------------ vista (pestaña del programa de capacitación)
  st.capEqAnio = st.capEqAnio || {};
  P.capEquipos = async (body, { ent, ctx }) => {
    const anio = st.capEqAnio[ent.id] || anioAct;
    let regs; try { regs = (await S.list(TB, { entidad_id: ent.id })); } catch (e) { body.innerHTML = '<div class="empty">Falta activar la tabla de registros (supabase/tecnovigilancia.sql).</div>'; return; }
    const ses = regs.filter((r) => r.tipo === 'sesion' && r.datos?.programa === 'equipos' && r.anio === anio).sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    const tests = regs.filter((r) => r.tipo === 'test');
    const tDe = (s, fz) => tests.filter((t) => t.datos.sesion_id === s.id && (!fz || t.datos.fase === fz));
    const ej = ses.filter((s) => s.datos?.estado === 'Ejecutada').length;
    const enInv = P.CAP_EQ.filter((c) => ctx.eqs.some((e) => c.re.test(e.nombre || '')));
    const fila = (s) => { const d = s.datos || {}, pr = TV.prom(tDe(s, 'pre')), po = TV.prom(tDe(s, 'post')), nA = (d.asistentes || []).filter((a) => a.nombre).length;
      return `<tr><td class="num">${fF(s.fecha)}</td><td><b>${h(d.equipo || '')}</b>${d.clase ? ` <span class="pill">Clase ${h(d.clase)}</span>` : ''}<div class="muted" style="font-size:.8rem">${h(d.tema || '')}${d.capacitador ? ' · ' + h(d.capacitador) : ''}</div></td>
        <td><span class="pill ${d.estado === 'Ejecutada' ? 'ok' : d.estado === 'Cancelada' ? 'bad' : s.fecha < UI.hoy() ? 'warn' : ''}">${h(d.estado || 'Programada')}</span></td><td class="num">${nA}</td><td class="num">${pr === null ? '' : pr + '%'}</td><td class="num">${po === null ? '' : po + '%'}</td>
        <td><div class="row-actions" style="flex-wrap:wrap"><button class="btn sm" data-ce="pres" data-id="${s.id}">${I.pdf} Presentación</button>${esProp() ? `<button class="btn sm ${d.enlace?.abierto ? 'pri' : ''}" data-ce="enlace" data-id="${s.id}" title="Enlace para que cada persona responda el pre y post test desde su celular">Enlace pre / post test${d.enlace?.abierto ? ' · abierto' : ''}</button><button class="btn sm" data-ce="aplicar" data-id="${s.id}" title="Diligenciar un test en esta pantalla">Aplicar test</button><button class="btn sm" data-ce="preg" data-id="${s.id}">Preguntas</button>` : ''}<button class="btn sm" data-ce="res" data-id="${s.id}">Resultados</button><button class="btn sm" data-ce="test" data-id="${s.id}">${I.pdf} Test en blanco</button><button class="btn sm" data-ce="asis" data-id="${s.id}">${I.pdf} Asistencia</button><button class="btn sm ${d.estado === 'Ejecutada' ? 'pri' : ''}" data-ce="acta" data-id="${s.id}">${I.pdf} Acta${(d.fotos || []).length ? ` · ${d.fotos.length} foto${d.fotos.length === 1 ? '' : 's'}` : ''}</button>
          ${esProp() ? `<button class="icon-btn" data-ce="edit" data-id="${s.id}" aria-label="Editar">${I.edit}</button><button class="icon-btn bad" data-ce="del" data-id="${s.id}" aria-label="Eliminar">${I.del}</button>` : ''}</div></td></tr>`; };
    body.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;align-items:flex-start"><div><h3 style="margin:0">Capacitaciones en equipos biomédicos · ${anio}</h3><span class="muted" style="font-size:.85rem">Por cada equipo: presentación, pre y post test (en pantalla o por enlace al celular), lista de asistencia y acta con resultados y evidencia fotográfica. Ejecutadas ${ej} de ${ses.length}${ses.length ? ` (${Math.round((ej / ses.length) * 100)} %)` : ''}.</span></div>
      <div class="actions"><select data-ce-anio aria-label="Año">${[anioAct + 1, anioAct, anioAct - 1].map((a) => `<option ${a === anio ? 'selected' : ''}>${a}</option>`).join('')}</select><button class="btn" data-ce="crono">${I.pdf} Cronograma</button>${esProp() ? `<button class="btn" data-ce="sugerido">${I.ia} Crear cronograma sugerido</button><button class="btn pri" data-ce="nueva">${I.mas} Capacitación</button>` : ''}</div></div>
      ${ses.length ? `<div class="tbl-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>Fecha</th><th>Equipo / tema</th><th>Estado</th><th>Asist.</th><th>Pre</th><th>Post</th><th></th></tr></thead><tbody>${ses.map(fila).join('')}</tbody></table></div>` : `<div class="empty" style="margin-top:10px">Sin capacitaciones programadas en ${anio}.${esProp() ? ` Use «Crear cronograma sugerido» para programar ${enInv.length ? enInv.map((c) => c.n.toLowerCase()).join(', ') : 'centrífugas, electrocardiógrafos, electrobisturí, ecógrafos y TENS'}.` : ''}</div>`}`;
    body.querySelector('[data-ce-anio]').onchange = (e) => { st.capEqAnio[ent.id] = +e.target.value; A.recargar(); };
    const S_ = (id) => ses.find((s) => s.id === id);
    const verDoc = (doc, titulo, nombre) => UI.verPDF({ titulo, blob: doc.output('blob'), nombre, extras: esProp() ? [{ t: 'Guardar en la carpeta', fn: async () => { const sub = await P.subDestino(ent, '4. CAPACITACIÓN - EDUCACIÓN CONTINUA'); await A.guardarPDF({ blob: doc.output('blob'), nombre, entidad_id: ent.id, equipo_id: null, carpeta: 'protocolos', subcarpeta: `${sub}/CAPACITACIONES EN EQUIPOS ${anio}` }); toast('Guardado en la carpeta'); return false; } }] : [] });
    body.onclick = async (e) => {
      const b = e.target.closest('[data-ce]'); if (!b) return; const s = S_(b.dataset.id), acc = b.dataset.ce;
      try {
        if (acc === 'nueva') return formSes(ent, ctx, null, anio, []);
        if (acc === 'edit') return formSes(ent, ctx, s, anio, tDe(s));
        if (acc === 'del') { const n = tDe(s).length; if (!(await confirmar(`¿Eliminar la capacitación «${s.datos?.tema}»${n ? ` y sus ${n} test` : ''}? No se puede deshacer.`, 'Eliminar'))) return; for (const t of tDe(s)) await S.remove(TB, t.id); await S.remove(TB, s.id); toast('Capacitación eliminada'); return A.recargar(); }
        if (acc === 'sugerido') return sugerido(ent, ctx, anio, ses);
        if (acc === 'crono') return verDoc(P.pdfCronoEquipos(ent, anio, ses), `Cronograma de capacitación en equipos ${anio}`, `Cronograma_capacitacion_equipos_${anio}_${slug(ent.razon_social)}.pdf`);
        if (acc === 'pres') return verDoc(P.pdfPresEquipo(ent, s, ctx), `Presentación · ${s.datos?.equipo}`, `Presentacion_${slug(s.datos?.equipo)}_${s.fecha}.pdf`);
        if (acc === 'enlace') return TV.enlaceVirtual(ent, s, tDe(s));
        if (acc === 'aplicar') return TV.aplicarTest(ent, s);
        if (acc === 'res') return TV.resultados(ent, s, tDe(s));
        if (acc === 'test') return modal({ titulo: 'Test en blanco', cuerpo: '<p>¿Qué desea generar?</p>', acciones: [{ t: 'Pre test', fn: () => verDoc(TV.pdfTest(ent, { ses: s, preguntas: s.datos.preguntas, fase: 'pre' }), 'Pre test en blanco', `Pre_test_${slug(s.datos?.equipo)}.pdf`) }, { t: 'Post test', fn: () => verDoc(TV.pdfTest(ent, { ses: s, preguntas: s.datos.preguntas, fase: 'post' }), 'Post test en blanco', `Post_test_${slug(s.datos?.equipo)}.pdf`) }, ...(esProp() ? [{ t: 'Clave de respuestas', cls: 'pri', fn: () => UI.verPDF({ titulo: 'Clave de respuestas', blob: TV.pdfClave(ent, { ses: s, preguntas: s.datos.preguntas }).output('blob'), nombre: `Clave_${slug(s.datos?.equipo)}.pdf` }) }] : [])] });
        if (acc === 'asis') { const doc = await TV.pdfAsistencia(ent, { ses: s, asistentes: (s.datos?.asistentes || []).filter((a) => a.nombre), tests: tDe(s) }); return verDoc(doc, `Lista de asistencia · ${s.datos?.equipo}`, `Asistencia_${slug(s.datos?.equipo)}_${s.fecha}.pdf`); }
        if (acc === 'preg') return formPreg(ent, s, tDe(s));
        if (acc === 'acta') return esProp() ? formActa(ent, ctx, s, tDe(s), verDoc) : verDoc(await P.pdfActaCap(ent, s, tDe(s), ctx), `Acta · ${s.datos?.equipo}`, `Acta_capacitacion_${slug(s.datos?.equipo)}_${s.fecha}.pdf`);
      } catch (er) { console.error(er); toast('Error: ' + er.message, true); }
    };
  };

  // cronograma sugerido: una capacitación por equipo, repartidas en el año (se repiten en el segundo semestre)
  const sugerido = async (ent, ctx, anio, ses) => {
    const lista = P.CAP_EQ.filter((c) => ctx.eqs.some((e) => c.re.test(e.nombre || '')));
    const usar = lista.length ? lista : P.CAP_EQ;
    modal({ titulo: `Cronograma sugerido ${anio}`, size: 'sm', cuerpo: `<form class="form" onsubmit="return false"><p class="muted" style="font-size:.88rem">Se crea una capacitación por equipo${lista.length ? ' (equipos encontrados en el inventario)' : ''}, con su presentación y las 10 preguntas del pre y post test. Puede cambiar las fechas después.</p>
      ${P.CAP_EQ.map((c) => `<label class="checks"><input type="checkbox" name="eq" value="${c.k}" ${usar.includes(c) ? 'checked' : ''}> ${h(c.n)} <small class="muted">· Clase ${c.clase}${ctx.eqs.some((e) => c.re.test(e.nombre || '')) ? ` · ${ctx.eqs.filter((e) => c.re.test(e.nombre || '')).length} en inventario` : ''}</small></label>`).join('')}
      <label class="checks" style="margin-top:8px"><input type="checkbox" name="semestral" value="1" checked> Repetir en el segundo semestre (capacitación semestral)</label></form>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Crear', cls: 'pri', fn: async (m) => {
        const ks = [...m.body.querySelectorAll('[name=eq]:checked')].map((x) => x.value), sem = m.body.querySelector('[name=semestral]').checked; if (!ks.length) { toast('Marque al menos un equipo', true); return false; }
        let i = 0; for (const k of ks) { const c = P.CAP_EQ.find((x) => x.k === k); for (const off of sem ? [0, 6] : [0]) { const mes = Math.min(12, 2 + (i % 5) + off); const ya = ses.some((s) => s.datos?.equipo_k === k && +String(s.fecha).slice(5, 7) === mes); if (!ya) await S.insert(TB, datosSes(ent, ctx, c, `${anio}-${String(mes).padStart(2, '0')}-15`)); } i++; }
        toast('Cronograma creado: ajuste fechas, lugar y capacitador'); A.recargar();
      } }] });
  };
  const datosSes = (ent, ctx, c, fecha, extra = {}) => {
    const eqs = c.re ? ctx.eqs.filter((e) => c.re.test(e.nombre || '')) : [], clase = (eqs.map((e) => e.clase_riesgo).filter(Boolean)[0]) || c.clase || '';
    const mes = +fecha.slice(5, 7);
    return { entidad_id: ent.id, tipo: 'sesion', anio: +fecha.slice(0, 4), periodo: mes <= 6 ? 'S1' : 'S2', fecha, datos: { programa: 'equipos', equipo_k: c.k, equipo: c.n, clase, tema: `Uso seguro, limpieza y cuidados: ${c.n.toLowerCase()}`, objetivo: c.objetivo, dirigido: c.dirigido, capacitador: st.emp?.responsable || '', modalidad: 'Presencial', duracion: '1 hora', estado: 'Programada', asistentes: [], preguntas: JSON.parse(JSON.stringify(c.preguntas)), ...extra } };
  };

  // ------------------------------------------------------------------ formulario de la capacitación
  const filaAsis = (a = {}) => `<div class="ce-asis" style="display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr auto;gap:6px;margin-bottom:6px"><input data-k="nombre" placeholder="Nombres y apellidos" value="${h(a.nombre || '')}" aria-label="Nombre"><input data-k="cedula" placeholder="Cédula" value="${h(a.cedula || '')}" aria-label="Cédula"><input data-k="cargo" placeholder="Cargo" value="${h(a.cargo || '')}" aria-label="Cargo"><input data-k="servicio" placeholder="Servicio" value="${h(a.servicio || '')}" aria-label="Servicio"><span style="display:flex;gap:4px;align-items:center"><span class="ce-firma" data-firma="${h(a.firma || '')}" style="display:inline-flex;width:64px;height:26px;border:1px dashed var(--line);border-radius:6px;align-items:center;justify-content:center;font-size:.7rem;overflow:hidden">${a.firma ? `<img src="${a.firma}" alt="Firma" style="max-height:24px">` : 'Sin firma'}</span><button type="button" class="btn sm" data-fdib title="Firmar">${I.firma}</button><button type="button" class="icon-btn bad" data-fdel aria-label="Quitar">${I.del}</button></span></div>`;
  const formSes = (ent, ctx, s, anio, tests) => {
    const d = s?.datos || {};
    const tipos = [...new Set(ctx.eqs.map((e) => String(e.nombre || '').toUpperCase().trim()).filter(Boolean))].sort();
    modal({ titulo: s ? `Capacitación · ${d.equipo || ''}` : 'Nueva capacitación en equipo biomédico', size: 'wide', cuerpo: `<form class="form" onsubmit="return false">
      <fieldset><legend>Programación</legend><div class="fields">
        ${f.sel('equipo_k', 'Equipo *', [...P.CAP_EQ.map((c) => [c.k, `${c.n} (Clase ${c.clase})`]), ['otro', 'Otro equipo del inventario']], d.equipo_k || P.CAP_EQ[0].k)}
        <label class="field" data-otro ${d.equipo_k === 'otro' ? '' : 'hidden'}><span>Nombre del equipo</span><input name="equipo_otro" list="ceTipos" value="${h(d.equipo_k === 'otro' ? d.equipo : '')}"><datalist id="ceTipos">${tipos.map((t) => `<option value="${h(t)}">`).join('')}</datalist></label>
        ${f.input('tema', 'Tema', d.tema || '', { full: true, attrs: 'placeholder="Uso seguro, limpieza y cuidados del equipo"' })}${f.area('objetivo', 'Objetivo', d.objetivo || '', { rows: 2 })}
        ${f.input('dirigido', 'Dirigido a', d.dirigido || '')}${f.input('capacitador', 'Capacitador', d.capacitador || st.emp?.responsable || '')}${f.input('fecha', 'Fecha programada *', s?.fecha || `${anio}-${String(new Date().getMonth() + 1).padStart(2, '0')}-15`, { type: 'date' })}${f.sel('modalidad', 'Modalidad', ['Presencial', 'Virtual', 'Mixta'], d.modalidad || 'Presencial')}${f.input('lugar', 'Lugar / sede', d.lugar || '')}${f.input('duracion', 'Intensidad', d.duracion || '1 hora')}</div></fieldset>
      <fieldset><legend>Ejecución</legend><div class="fields">${f.sel('estado', 'Estado', ['Programada', 'Ejecutada', 'Reprogramada', 'Cancelada'], d.estado || 'Programada')}${f.input('fecha_ejec', 'Fecha de ejecución', d.fecha_ejec || '', { type: 'date' })}${f.input('hora_ini', 'Hora inicial', d.hora_ini || '', { type: 'time' })}${f.input('hora_fin', 'Hora final', d.hora_fin || '', { type: 'time' })}</div></fieldset>
      <fieldset><legend>Lista de asistencia</legend><p class="muted" style="font-size:.82rem;margin:0 0 6px">Quien responde el test (por enlace o en pantalla) se agrega solo. Cada asistente puede firmar aquí.</p><div data-asis>${(d.asistentes || []).map(filaAsis).join('')}</div>
        <div class="actions"><button type="button" class="btn sm" data-add>${I.mas} Asistente</button>${tests.length ? '<button type="button" class="btn sm" data-imp>Agregar los que presentaron el test</button>' : ''}</div></fieldset></form>`,
      alAbrir: (m) => {
        const cont = m.body.querySelector('[data-asis]'), sel = m.body.querySelector('[name=equipo_k]');
        if (!cont.children.length) for (let i = 0; i < 3; i++) cont.insertAdjacentHTML('beforeend', filaAsis());
        sel.onchange = () => { m.body.querySelector('[data-otro]').hidden = sel.value !== 'otro'; const c = P.CAP_EQ.find((x) => x.k === sel.value); if (c && !s) { m.body.querySelector('[name=tema]').value = `Uso seguro, limpieza y cuidados: ${c.n.toLowerCase()}`; m.body.querySelector('[name=objetivo]').value = c.objetivo; m.body.querySelector('[name=dirigido]').value = c.dirigido; } };
        if (!s) sel.onchange();
        m.body.querySelector('[data-add]').onclick = () => cont.insertAdjacentHTML('beforeend', filaAsis());
        m.body.querySelector('[data-imp]')?.addEventListener('click', () => { const ya = new Set([...cont.querySelectorAll('[data-k=cedula]')].map((i) => i.value.trim()).filter(Boolean)); tests.forEach((t) => { if (!ya.has(t.datos.cedula)) { ya.add(t.datos.cedula); cont.insertAdjacentHTML('beforeend', filaAsis(t.datos)); } }); });
        cont.addEventListener('click', async (e) => { const row = e.target.closest('.ce-asis'); if (!row) return; if (e.target.closest('[data-fdel]')) { row.remove(); return; } if (e.target.closest('[data-fdib]')) { const r = await UI.pedirFirma({ titulo: `Firma · ${row.querySelector('[data-k=nombre]').value}` }); if (r) { const c = row.querySelector('.ce-firma'); c.dataset.firma = r; c.innerHTML = `<img src="${r}" alt="Firma" style="max-height:24px">`; } } });
      },
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
        const v = leer(m.body); if (!v.fecha) { toast('Indique la fecha', true); return false; }
        const c = v.equipo_k === 'otro' ? P.capGenerico(String(v.equipo_otro || '').trim().toUpperCase() || 'EQUIPO BIOMÉDICO') : P.CAP_EQ.find((x) => x.k === v.equipo_k);
        if (v.equipo_k === 'otro' && !String(v.equipo_otro || '').trim()) { toast('Escriba el nombre del equipo', true); return false; }
        const asistentes = [...m.body.querySelectorAll('.ce-asis')].map((r) => ({ nombre: r.querySelector('[data-k=nombre]').value.trim(), cedula: r.querySelector('[data-k=cedula]').value.trim(), cargo: r.querySelector('[data-k=cargo]').value.trim(), servicio: r.querySelector('[data-k=servicio]').value.trim(), firma: r.querySelector('.ce-firma').dataset.firma || null })).filter((a) => a.nombre);
        const base = datosSes(ent, ctx, c, v.fecha);
        const cambioEq = !s || d.equipo_k !== v.equipo_k || (v.equipo_k === 'otro' && d.equipo !== c.n);
        const datos = { ...(s ? d : base.datos), equipo_k: v.equipo_k, equipo: c.n, clase: cambioEq ? base.datos.clase : d.clase, tema: v.tema || base.datos.tema, objetivo: v.objetivo || c.objetivo, dirigido: v.dirigido, capacitador: v.capacitador, modalidad: v.modalidad, lugar: v.lugar, duracion: v.duracion, estado: v.estado, fecha_ejec: v.fecha_ejec || (v.estado === 'Ejecutada' ? v.fecha : ''), hora_ini: v.hora_ini, hora_fin: v.hora_fin, asistentes, ...(cambioEq && !tests.length ? { preguntas: base.datos.preguntas } : {}) };
        const o = { ...base, datos };
        if (s) await S.update(TB, s.id, o); else await S.insert(TB, o); toast('Capacitación guardada'); A.recargar();
      } }] });
  };

  // preguntas de la sesión
  const formPreg = (ent, s, tests) => modal({ titulo: `Preguntas del pre y post test · ${s.datos?.equipo || ''}`, size: 'wide', cuerpo: `<p class="muted" style="font-size:.85rem">Una pregunta por bloque: <span class="mono">1. Pregunta</span> y debajo las opciones <span class="mono">a) …</span>. Marque con <span class="mono">*</span> la correcta, ej. <span class="mono">*b) opción correcta</span>.${tests.length ? ` <b>Ya hay ${tests.length} test presentados:</b> si cambia las preguntas, sus calificaciones no se recalculan.` : ''}</p><textarea data-tx rows="24" style="width:100%;font-family:ui-monospace,monospace;font-size:.8rem">${h(TV.txtBanco(s.datos?.preguntas || []))}</textarea>`,
    acciones: [{ t: 'Restablecer preguntas base', fn: (m) => { m.body.querySelector('[data-tx]').value = TV.txtBanco(P.capDe(s.datos).preguntas); return false; } }, { t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => { const l = TV.leerBanco(m.body.querySelector('[data-tx]').value); if (l.length < 3) { toast('Se necesitan al menos 3 preguntas con su respuesta marcada con *', true); return false; } await S.update(TB, s.id, { datos: { ...s.datos, preguntas: l } }); toast(`${l.length} preguntas guardadas`); A.recargar(); } }] });

  // acta: contenido, conclusiones, compromisos, fotos y firma de quien recibe
  const formActa = (ent, ctx, s, tests, verDoc) => {
    const d = s.datos || {}, a = d.acta || {}, cap = P.capDe(d); let fotos = [...(d.fotos || [])], firma = a.firma_recibe || null;
    const pintarFotos = (m) => { m.body.querySelector('[data-fotos]').innerHTML = fotos.length ? fotos.map((x, i) => `<span class="pill" style="display:inline-flex;gap:6px;align-items:center">${h(x.nombre)}<button type="button" class="icon-btn bad" data-rmf="${i}" aria-label="Quitar foto">${I.x}</button></span>`).join(' ') : '<span class="muted">Sin fotos.</span>'; };
    modal({ titulo: `Acta de capacitación · ${d.equipo || ''}`, size: 'wide', cuerpo: `<form class="form" onsubmit="return false"><p class="muted" style="font-size:.85rem">El acta incluye los datos de la capacitación, los asistentes con sus resultados del pre y post test (${tests.filter((t) => t.datos.fase === 'pre').length} pre · ${tests.filter((t) => t.datos.fase === 'post').length} post), el consolidado con gráfica y la evidencia fotográfica.</p>
      <div class="fields">${f.area('contenido', 'Contenido desarrollado (un tema por línea)', a.contenido || cap.diapos.map(([t]) => t).join('\n'), { rows: 6 })}${f.area('conclusiones', 'Conclusiones (vacío = se redactan con los resultados)', a.conclusiones || '', { rows: 3 })}${f.area('compromisos', 'Compromisos (uno por línea)', a.compromisos || '', { rows: 3 })}
        ${f.input('recibe', 'Recibe · nombre (responsable de la entidad)', a.recibe || '')}${f.input('cargo_recibe', 'Recibe · cargo', a.cargo_recibe || '')}</div>
      <div class="actions" style="margin:6px 0"><button type="button" class="btn sm" data-firma>${I.firma} Firma de quien recibe</button><span data-fprev class="muted">${firma ? '✓ Firmada' : 'Sin firma'}</span></div>
      <fieldset><legend>Evidencia fotográfica</legend><div data-fotos></div><label class="btn sm" style="margin-top:6px">${I.subir} Agregar fotos<input type="file" accept="image/*" multiple hidden data-subir></label><p class="muted" style="font-size:.8rem">Las fotos se reducen y se guardan también en la carpeta de la entidad (evidencias de la capacitación).</p></fieldset></form>`,
      alAbrir: (m) => {
        pintarFotos(m);
        m.body.querySelector('[data-fotos]').onclick = (e) => { const b = e.target.closest('[data-rmf]'); if (b) { fotos.splice(+b.dataset.rmf, 1); pintarFotos(m); } };
        m.body.querySelector('[data-firma]').onclick = async () => { const r = await UI.pedirFirma({ titulo: 'Firma de quien recibe la capacitación', actual: firma }); if (r) { firma = r; m.body.querySelector('[data-fprev]').textContent = '✓ Firmada'; } };
        m.body.querySelector('[data-subir]').onchange = async (e) => {
          const fl = [...e.target.files]; e.target.value = ''; if (!fl.length) return; toast('Subiendo fotos…');
          const sub = await P.subDestino(ent, '4. CAPACITACIÓN - EDUCACIÓN CONTINUA');
          for (const file of fl) { try { const b = await reducir(file), nombre = `Evidencia ${d.equipo || ''} ${fF(d.fecha_ejec || s.fecha)} (${fotos.length + 1}).jpg`, path = `${ent.id}/general/protocolos/${Date.now()}-${slug(nombre)}.jpg`;
            await S.upload(path, b); await S.insert('documentos', { entidad_id: ent.id, equipo_id: null, carpeta: 'protocolos', subcarpeta: `${sub}/CAPACITACIONES EN EQUIPOS ${s.anio}/EVIDENCIAS`, nombre, archivo: path, mime: 'image/jpeg', tamano: b.size, fecha_documento: UI.hoy(), visible_cliente: true, firmado: false });
            fotos.push({ archivo: path, nombre }); } catch (er) { toast(`${file.name}: ${er.message}`, true); } }
          pintarFotos(m); toast('Fotos agregadas (pulse Guardar)');
        };
      },
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar', fn: (m) => guardar(m, false) }, { t: 'Guardar y ver acta (PDF)', cls: 'pri', fn: (m) => guardar(m, true) }] });
    async function guardar(m, ver) {
      const v = leer(m.body); const nd = { ...d, fotos, acta: { contenido: v.contenido, conclusiones: v.conclusiones, compromisos: v.compromisos, recibe: v.recibe, cargo_recibe: v.cargo_recibe, firma_recibe: firma } };
      await S.update(TB, s.id, { datos: nd }); s.datos = nd; toast('Acta guardada');
      if (ver) { const doc = await P.pdfActaCap(ent, s, tests, ctx); verDoc(doc, `Acta de capacitación · ${d.equipo}`, `Acta_capacitacion_${slug(d.equipo)}_${d.fecha_ejec || s.fecha}.pdf`); }
      else A.recargar();
    }
  };
})();
